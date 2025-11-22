# HexiQnix - SVG Icon Converter

**HexiQnix** is a simple yet powerful web application designed to convert SVG files into XML format. Originally created for custom CMS systems, the app offers features such as easy renaming, XML-formatted output, editing capabilities, custom notifications, and the ability to save icons within the app. It aims to streamline the process of working with multiple icons, especially in large-scale projects.

---

## V2.0 Update: Transformation and Usability Improvements

**HexiQnix V2 is now available**, featuring enhancements to core usability and powerful new transformation capabilities. This version offers a cleaner experience, real-time feedback, and more granular control over icon rendering.

### What's New in Version 2?

* **Real-Time Conversion:** The manual "Convert" button is removed. The converted code section now **updates automatically** whenever you change an input or setting, providing instant feedback and a smoother workflow.

* **Intuitive UI/UX Overhaul:** The application features a **fully redesigned interface** with improved clarity and user-friendliness, making icon manipulation faster and easier.

* **Advanced Icon Transformation Panel:** A new dedicated panel provides fine control over visual geometry:
    * **Icon Rotation:** Rotate your icon to any desired degree.
    * **Dimension Control:** Easily adjust the icon's **Width** and **Height** dimensions.
    * **Flip Options:** Quickly flip the icon horizontally or vertically.

* **Custom Preview Background:** You can now set a custom background color for the live preview, allowing you to **test contrast** and visibility against various application themes.

* **User-Friendly CSS Integration:** Added a new implementation for generating and integrating **CSS code** in a format that is ready for quick use in your projects.

* **Cleaner, More Functional Codebase:** Significant internal code cleanup for more robust performance. The app now ensures graphic elements are properly initialized for rendering (e.g., ensuring graphical parts are covered with `fill="none"` when necessary at the SVG level), leading to more reliable and predictable converted output.

---

## Features

* **SVG to XML Conversion**: Converts your SVG files into XML format, suitable for use with CMS systems.

* **Rename Icons**: Option to give your SVG icons a custom name.

* **Advanced Editing Options**:
    * **Fill Color**: Change the SVG fill color with ease.
    * **Stroke Color**: Modify the stroke color.
    * **Advanced Path Settings**: Customize fill-rule, clip-rule, and defs for fine control over your SVG paths.

* **Save Icons**: Save your edited icons directly within the web app. Icons are stored in a grid, enabling you to compare, organize, and reuse them for other projects as needed.

* **Copy Code**: Easily copy the SVG/XML code to your clipboard for quick use.

* **Error Handling**: Built-in error handling to make the process seamless and prevent mistakes.

* **Custom Notifications**: Notification system to alert you on success or errors.

* **Preview**: A live preview of your SVG icon for visual feedback.

## How to Use

1.  **Upload an SVG File**: Click the "Upload SVG" button to load your SVG file into the application.

2.  **Paste SVG Code**: Alternatively, paste your raw SVG code directly into the provided text area.

3.  **Customize**:
    * Modify the icon's fill and stroke colors.
    * Toggle advanced path settings for fine control.
    * Rename your icon as needed.

4.  **Convert**: *Conversion is now instant and automatic as you customize.*

5.  **Save or Copy**:
    * **Save**: Save the icon within the web app to the grid for later use or comparison.
    * **Copy**: Copy the generated SVG/XML code to your clipboard.

6.  **Preview**: View a live preview of your updated icon.

## Tech Stack

* **HTML5**: For structuring the web application.
* **CSS3**: For styling the app with a clean and minimalistic design.
* **JavaScript**: For interactivity and the logic behind converting, editing, saving, and copying SVG icons.

## License

This project is open-source and available under the MIT License.

## Acknowledgements

The project was developed to help manage SVG icons and simplify integration with CMS systems.