# MergeMaster

MergeMaster is a small, browser-based tool for turning **message templates** into finished text. You define **profiles** (named templates with placeholders), then fill those placeholders by hand, from a CSV, or both. The result is easy to copy into email, chat, or any other channel.

There is no server: everything runs in your browser. Profiles are stored in **localStorage** on your device. Use **Export JSON** / **Import JSON** to back up profiles or move them between machines.

---

## What you can do

### Profiles

- **Create, edit, and delete** profiles. Each profile has a **name**, a **template** (the message body), and two configurable bracket pairs: one for **regular variables** and one for **global variables**.
- **Variables** are written as *open bracket* + *name* + *close bracket*. Two kinds of placeholders can appear in the same template:
  - **Regular variables** — defaults `{{` and `}}` (for example `Hello {{name}}`). Filled per row in Compose / List compose.
  - **Global variables** — defaults `[[` and `]]` (for example `[[campaign]] Hello {{name}}`). Filled **once per list** in List compose and applied to every row.
- You can change either bracket pair per profile if your content already uses `{{` or `[[` for something else.
- **Save** updates the profile in the browser. **Export JSON** downloads a file you can archive or share. **Import JSON** loads a file in this shape:

```json
{
  "name": "My profile",
  "template": "[[campaign]] Hello {{name}}, your code is {{code}}",
  "variableBracketOpen": "{{",
  "variableBracketClose": "}}",
  "globalVariableBracketOpen": "[[",
  "globalVariableBracketClose": "]]"
}
```

If any of the bracket fields are missing, they default to `{{` / `}}` for regular variables and `[[` / `]]` for globals.

### Compose

- Pick a **profile**, then either type values for each regular variable or **import a CSV**.
- CSV rules: the **first row** is the header; column names should match your **regular** variable names (not the bracket characters, and not global variables). **One data row** fills the form and produces one merged message. **Several data rows** produce one merged block per row, separated by a line of `---` in the result text area.
- **Copy to clipboard** copies the full result area.

### List compose

- Built for **CSV-driven batches**: choose a profile, optionally fill **Globals**, import a CSV, and get **one card per data row**, each with its own **Copy** button so you do not have to select text inside a large result field.
- **Globals** appear in their own column at the top. They are filled once and applied to every row in the list. CSV columns only map to regular variable names — not to global ones.
- **Add row** appends a single **manual** row (fields for each regular variable, preview, Copy, Remove). Use it for one-offs without editing a CSV.
- **Clear list & file** empties the list and clears the CSV file input. Changing the profile also clears the list.

---

## Running the app

Open `index.html` in a modern browser, or go to https://lowlevelkiwi.github.io/MergeMaster/ to access the hosted version

---

## Tech stack

HTML, CSS, and vanilla JavaScript only — no build step.
