import { SMARTSHEET_REGISTERS } from "../src/lib/smartsheet-registers.js";

const SMARTSHEET_API = "https://api.smartsheet.com/2.0";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setCors(req, res) {
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    ...(process.env.SHEETLENS_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ]);
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization");
    return true;
  }
  return !origin;
}

function emailKey(value) {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim())
    ? value.trim().toLowerCase()
    : null;
}

function collectEmails(value, emails = new Set()) {
  if (typeof value === "string") {
    const email = emailKey(value);
    if (email) emails.add(email);
  } else if (Array.isArray(value)) {
    for (const item of value) collectEmails(item, emails);
  } else if (typeof value === "object" && value !== null) {
    if ("email" in value && typeof value.email === "string") {
      const email = emailKey(value.email);
      if (email) emails.add(email);
    }
    for (const [key, nested] of Object.entries(value)) {
      if (key !== "email") collectEmails(nested, emails);
    }
  }
  return emails;
}

function cellEmails(cell) {
  if (!cell) return [];
  const emails = new Set();
  collectEmails(cell.objectValue, emails);
  collectEmails(cell.value, emails);
  collectEmails(cell.displayValue, emails);
  return [...emails];
}

function cellValue(cell) {
  return cell?.displayValue ?? cell?.value ?? "";
}

function hasCellValue(cell) {
  return Boolean(cell && (cellValue(cell) || cell.objectValue));
}

function columnId(sheet, title, registerName) {
  const column = sheet.columns?.find((item) => item.title === title);
  if (!column) {
    const error = new Error(`The ${registerName} register is missing the "${title}" column.`);
    error.statusCode = 422;
    throw error;
  }
  return column.id;
}

async function fetchSmartsheet(path, authorization) {
  const response = await fetch(`${SMARTSHEET_API}${path}`, {
    headers: { Authorization: authorization },
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`Smartsheet returned ${response.status}: ${text}`);
    error.statusCode = response.status;
    throw error;
  }
  return JSON.parse(text);
}

async function fetchSheet(sheetId, authorization) {
  const params = new URLSearchParams({
    include: "objectValue",
    level: "1",
    pageSize: "5000",
  });
  return fetchSmartsheet(`/sheets/${sheetId}?${params}`, authorization);
}

function isTrue(value) {
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
}

export default async function handler(req, res) {
  if (!setCors(req, res)) {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "A Smartsheet bearer token is required." });
  }

  try {
    const [user, people, tasks] = await Promise.all([
      fetchSmartsheet("/users/me", authorization),
      fetchSheet(SMARTSHEET_REGISTERS.sheets.people, authorization),
      fetchSheet(SMARTSHEET_REGISTERS.sheets.tasks, authorization),
    ]);

    const userEmail = emailKey(user.email);
    if (!userEmail) {
      return res.status(422).json({
        error: "Smartsheet did not provide an email address for the signed-in user.",
      });
    }

    const peopleEmailColumn = columnId(
      people,
      SMARTSHEET_REGISTERS.personEmailColumn,
      "People",
    );
    const contributorColumn = columnId(
      people,
      SMARTSHEET_REGISTERS.contributorRoleColumn,
      "People",
    );
    const matchingPeople = (people.rows || []).filter((row) => {
      const emailCell = row.cells.find((cell) => cell.columnId === peopleEmailColumn);
      return cellEmails(emailCell).includes(userEmail);
    });

    if (matchingPeople.length === 0) {
      return res.status(403).json({
        error: "Your Smartsheet email was not found in the People register.",
      });
    }
    if (matchingPeople.length > 1) {
      return res.status(409).json({
        error: "Your email matches multiple People register records. Ask an administrator to resolve the duplicate.",
      });
    }

    const roleCell = matchingPeople[0].cells.find(
      (cell) => cell.columnId === contributorColumn,
    );
    if (!isTrue(cellValue(roleCell))) {
      return res.status(403).json({
        error: "The Contributor role is not enabled for your People register record.",
      });
    }

    const driverColumn = columnId(
      tasks,
      SMARTSHEET_REGISTERS.taskDriverColumn,
      "Tasks",
    );
    const visibleColumns = SMARTSHEET_REGISTERS.contributorTaskColumns.map((title) => ({
      title,
      id: columnId(tasks, title, "Tasks"),
    }));

    let unmatchedDriverCount = 0;
    const assignedTasks = (tasks.rows || []).flatMap((row) => {
      const driverCell = row.cells.find((cell) => cell.columnId === driverColumn);
      const driverEmails = cellEmails(driverCell);
      if (!driverEmails.length && hasCellValue(driverCell)) {
        unmatchedDriverCount += 1;
      }
      if (!driverEmails.includes(userEmail)) return [];

      const task = { _rowId: row.id, _rowNumber: row.rowNumber };
      for (const column of visibleColumns) {
        const cell = row.cells.find((item) => item.columnId === column.id);
        task[column.title] = cellValue(cell);
      }
      return [task];
    });

    return res.status(200).json({
      user: { email: userEmail, name: user.name ?? user.email },
      tasks: {
        columns: visibleColumns.map((column) => column.title),
        rows: assignedTasks,
      },
      unmatchedDriverCount,
    });
  } catch (error) {
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? error.statusCode
        : 502;
    if (statusCode >= 500) {
      console.error("Could not load contributor tasks.", error);
    }
    return res.status(statusCode).json({
      error: error instanceof Error ? error.message : "Could not load contributor tasks.",
    });
  }
}
