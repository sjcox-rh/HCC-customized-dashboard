# HCC Enhanced Dashboard UI — SJ's Prototype

A customized UX prototype exploring enhanced dashboard experiences for the Hybrid Cloud Console, built on top of the [HCC AI Widget Builder](https://github.com/maryshak1996/hcc-nextgenui-widget-builder) by Mary Shakshober.

---

## What's Changed

This prototype extends the original with the following UX enhancements:

### Add Widgets in Help Panel
- Moved the "Add Widgets" UI from a standalone drawer into the existing help side panel
- Two tabs: **Find widgets** (catalog with available/already-added sections) and **Widget builder** (code editor + live preview)
- Help panel header dynamically shows "Add Widgets" when that view is active
- "Add widgets" toolbar button shows active state while the panel is open and toggles it closed on re-click

### Share Dashboard Modal
- "Copy JSON config" action replaced with a **Share dashboard** modal
- Modal displays the full JSON config in a read-only clipboard block with descriptive text explaining how to share dashboards with others in your organization
- Dropdown menu items renamed from "Copy JSON config" to "Share dashboard" with a share icon

### Prebuilt Dashboard UX
- Disabled "Edit dashboard" buttons replaced with enabled **Duplicate dashboard** CTA for system default dashboards
- Tooltip on hover: *"System default dashboards are not editable. Create a duplicate in order to edit this dashboard."*
- Disabled edit icon in dashboard selector dropdown shows tooltip: *"System default dashboards are uneditable."*
- Disabled "Edit dashboard" removed from hub list kebab menu for prebuilt dashboards

### Styling & Polish
- Active tab underline color changed to PatternFly blue
- Widget builder layout adapted for narrow side panel
- Code editor given a fixed height (280px) so Markdown is visible
- Browser tab title: **SJ's HCC Prototype**
- Removed "Red Hat status page" link, search hint text, and widget count text from help panel

---

## Tech Stack

- **React 18** + **TypeScript**
- **PatternFly 6**
- **Webpack 5**

---

## Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm start
```

The app will be available at **http://localhost:9000**.

Build for production:

```bash
npm run build
```

---

## Original Project

Based on [maryshak1996/hcc-nextgenui-widget-builder](https://github.com/maryshak1996/hcc-nextgenui-widget-builder).

---

## Maintained By

SJ Cox
