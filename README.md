# MergeMaster

MergeMaster is a small, browser-based tool for turning **message text** into finished copy. You define **templates** (named presets: a message body plus placeholder rules), then fill placeholders by hand, from a **source file** (comma-separated values), or both. The result is easy to copy into email, chat, or any other channel.

There is no server: everything runs in your browser. Templates are stored in **localStorage** on your device. If you used an older build, data under the previous storage key is migrated automatically on first load. Use **Export JSON** / **Import JSON** to back up templates or move them between machines.

---

## What you can do

### Templates

- **Create, edit, and delete** templates on the **Templates** tab. Each saved template has a **name**, a **`template` field** (the message body text), and two configurable bracket pairs: one for **regular variables** and one for **global variables**.
- **Variables** are written as *open bracket* + *name* + *close bracket*. Two kinds of placeholders can appear in the same message:
  - **Regular variables** — defaults `{{` and `}}` (for example `Hello {{name}}`). Filled per row on **Compose** and **List compose**.
  - **Global variables** — defaults `[[` and `]]` (for example `[[campaign]] Hello {{name}}`). Filled **once per list** on **List compose** and applied to every row.
- You can change either bracket pair per saved template if your content already uses `{{` or `[[` for something else.
- **Variable names are case-insensitive.** `{{name}}`, `{{Name}}`, and `{{NAME}}` in the same template all refer to one variable. In the UI, each name is listed once with a **capital first letter** (e.g. `Name`). Your message text can keep whatever casing you prefer in the placeholders.
- **Save** updates the template in the browser. **Export JSON** downloads a file you can archive or share. **Import JSON** loads a file in this shape:

```json
{
  "name": "My template",
  "template": "[[campaign]] Hello {{name}}, your code is {{code}}",
  "variableBracketOpen": "{{",
  "variableBracketClose": "}}",
  "globalVariableBracketOpen": "[[",
  "globalVariableBracketClose": "]]"
}
```

If any of the bracket fields are missing, they default to `{{` / `}}` for regular variables and `[[` / `]]` for globals.

### Compose

- On the **Compose** tab, pick a **template** (saved preset), then either type values for each regular variable or import a **source file**.
- **Source file** rules: the **first row** is the header; column names should match your **regular** variable names (not the bracket characters, and not global variables). Header matching is **case-insensitive** (e.g. a column `NAME` fills variable `Name`). **One data row** fills the form and produces one merged message. **Several data rows** produce one merged block per row, separated by a line of `---` in the result text area.
- **Copy to clipboard** copies the full result area.

### List compose

- On the **List compose** tab, built for **batches from a source file**: choose a template, optionally fill **Globals**, import a source file, and get **one card per data row**, each with its own **Copy** button so you do not have to select text inside a large result field.
- **Globals** appear in their own column at the top. They are filled once and applied to every row in the list. Labels use a capital first letter; names are case-insensitive. Source columns only map to regular variable names — not to global ones (also case-insensitive).
- **Add row** appends a single **manual** row (fields for each regular variable, preview, Copy, Remove). Use it for one-offs without editing a source file.
- **Clear list & file** empties the list and clears the source file input. Changing the selected template also clears the list.

---

## Running the app

Open `index.html` in a modern browser, or go to https://lowlevelkiwi.github.io/MergeMaster/ to access the hosted version.

---

## Tech stack

HTML, CSS, and vanilla JavaScript only — no build step.
