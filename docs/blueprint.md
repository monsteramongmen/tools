# **App Name**: AR Toolkit

## Core Features:

- Navbar: Navigation bar with links to 'Home', 'AR Viewer', and 'Capture & Share'.
- Homepage: Display a landing page with 'AR Viewer' and 'Capture & Share' cards with a brief description.
- AR Viewer: AR viewer to start/stop camera, render video from http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 or render a 3D model from https://cdn.einstonlabs.com/ingressify/low-poly_conveyor_for_scada__hmi.glb.
- 3D Controls: User controls (rotate, zoom in, zoom out) for 3D model within the AR viewer. Includes logic for detecting marker from https://github.com/RanjanLGHIVE/cdn/blob/main/uploads/mindar_target.mind.
- Capture & Share: Open the device camera, allow users to take high-quality snapshots, preview, retry, confirm, download, and share.
- Footer: Add a footer with credits.

## Style Guidelines:

- Primary color: Deep purple (#6750A4) for a modern, sophisticated feel. This color evokes creativity and innovation.
- Background color: Light gray (#F2F0F7), very desaturated purple. This provides a clean, neutral backdrop that will make the content stand out.
- Accent color: Blue violet (#8069C2), an analogous color, brighter than the primary for a clear visual distinction.
- Body and headline font: 'Inter', a sans-serif font, will be used throughout the application. Its neutral and modern design works well for both headings and body text.
- Use simple, modern icons for navigation and actions within the app.
- Implement a fully responsive layout using a CSS framework like TailwindCSS.
- Subtle transitions and animations on UI elements to improve user experience.