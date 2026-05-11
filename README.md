# MergeMaster

MergeMaster is a small, browser-based tool for turning **message templates** into finished text. You define **profiles** (named templates with placeholders), then fill those placeholders by hand, from a CSV, or both. The result is easy to copy into email, chat, or any other channel.

There is no server: everything runs in your browser. Profiles are stored in **localStorage** on your device. Use **Export JSON** / **Import JSON** to back up profiles or move them between machines (for example by keeping files in the `Profiles` folder in this repo).

---

## What you can do

### Profiles

- **Create, edit, and delete** profiles. Each profile has a **name**, a **template** (the message body), and optional **custom brackets** around variable names.
- **Variables** are written as *open bracket* + *name* + *close bracket*. The default brackets are `{{` and `}}` (for example `Hello {{name}}`). You can change open/close strings per profile if your content already uses `{{` for something else.
- **Save** updates the profile in the browser. **Export JSON** downloads a file you can archive or share. **Import JSON** loads a file in this shape:

```json
{
  "name": "My profile",
  "template": "Hello {{name}}, code: {{code}}",
  "variableBracketOpen": "{{",
  "variableBracketClose": "}}"
}
```

If `variableBracketOpen` / `variableBracketClose` are missing, they default to `{{` and `}}`.

On first use, if nothing is stored yet, the app may load `Profiles/Test_Profile.json` when you open the site over **HTTP** (not always when opening the file directly as `file://`).

### Compose

- Pick a **profile**, then either type values for each variable or **import a CSV**.
- CSV rules: the **first row** is the header; column names should match your variable names (not the bracket characters). **One data row** fills the form and produces one merged message. **Several data rows** produce one merged block per row, separated by a line of `---` in the result text area.
- **Copy to clipboard** copies the full result area.

### List compose

- Built for **CSV-driven batches**: choose a profile, import a CSV, and get **one card per data row**, each with its own **Copy** button so you do not have to select text inside a large result field.
- **Add row** appends a single **manual** row (fields for each variable, preview, Copy, Remove). Use it for one-offs without editing a CSV.
- **Clear list & file** empties the list and clears the CSV file input. Changing the profile clears the list.

---

## Running the app

Open `index.html` in a modern browser, or serve the project folder with any static server (for example `npx serve .`) so optional loading of `Profiles/*.json` works reliably.

---

## Tech stack

HTML, CSS, and vanilla JavaScript only—no build step.
