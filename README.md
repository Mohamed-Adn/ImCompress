# ImCompress: Intelligent Image Resizing & Compression

ImCompress is a modern, web-based tool designed to make image optimization a breeze. It leverages AI to suggest optimal settings and supports both single and bulk image processing to streamline your workflow.

## Features

-   **Single Image Mode**: Upload, resize, and compress individual images with fine-grained control over dimensions, quality, and format.
-   **Bulk Image Mode**: Process multiple images at once. Apply global settings or tweak each image individually.
-   **AI-Powered Suggestions**: Utilizes Genkit to analyze your image and recommend the best compression and resizing settings to balance quality and file size.
-   **Multiple Formats**: Supports popular web formats including JPEG, PNG, and WebP.
-   **Drag & Drop**: Easily upload files by dragging them onto the application window.
-   **Download Options**: Download optimized images individually or as a single ZIP archive in bulk mode.
-   **Modern UI**: Built with ShadCN UI and Tailwind CSS for a clean, responsive, and intuitive user experience.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **AI/Generative**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **File Archiving**: [JSZip](https://stuk.github.io/jszip/)

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   Node.js (v18 or later)
-   npm or your preferred package manager

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    To use the AI features, you need to configure your Gemini API key. Create a `.env.local` file in the root of the project and add your key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

### Running the Application

1.  **Start the development server:**
    This command runs the Next.js application.
    ```bash
    npm run dev
    ```

2.  **Start the Genkit development server:**
    For the AI functionalities to work, you also need to run the Genkit server in a separate terminal.
    ```bash
    npm run genkit:watch
    ```

3.  Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Project Structure

-   `src/app/`: Main application pages and layout (Next.js App Router).
-   `src/components/`: Reusable React components, including UI components from ShadCN.
-   `src/ai/`: Contains all Genkit-related code.
    -   `src/ai/flows/`: Genkit flows that define the AI logic.
-   `src/lib/`: Utility functions and shared libraries.
-   `public/`: Static assets.
