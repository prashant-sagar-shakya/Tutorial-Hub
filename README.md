# TutHub - AI Powered Course Generator 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Clerk Auth](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
[![Vercel Deploy](https://img.shields.io/badge/Deploy_with-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2FYOUR_REPOSITORY)

**TutHub** is an innovative platform that leverages the power of Artificial Intelligence, specifically Google's Gemini models, to help users effortlessly generate comprehensive educational courses. Simply provide a topic, and TutHub's AI will craft a structured course outline, detailed chapter content, relevant YouTube video integrations, and even quiz questions!

![TutHub Demo](demo.png)

---

## ✨ Features

*   **🤖 AI-Powered Course Outline Generation:** Input your course topic, category, level, and duration, and let AI generate a structured curriculum.
*   **📚 Detailed Chapter Content:** For each chapter in the outline, AI generates in-depth explanations, sections, and even code examples where applicable.
*   **▶️ Automatic YouTube Video Integration:** Relevant YouTube videos are automatically fetched and embedded for each chapter to enhance learning.
*   **🖼️ Automatic Course Banner Generation:** AI searches for a relevant image based on the course topic to be used as a banner (via Pexels/Unsplash).
*   **✍️ Course Editing & Customization:** Users can edit generated course details, chapter names, descriptions, and upload custom banner images.
*   **🧠 AI-Generated Quizzes:** Quizzes are automatically generated for courses/chapters to test understanding.
*   **📊 Quiz Performance Tracking:** User quiz attempts and scores are saved.
*   **💬 AI Chat Assistant (TutHub AI):**
    *   Integrated chat with Gemini for asking questions, getting help, or exploring topics further.
    *   Session-based chat history saved to the database.
*   **🔐 Secure User Authentication:** Powered by Clerk for robust sign-up, sign-in, and user management.
*   **🖥️ User Dashboard:** Manage created courses, explore other courses, and track progress.
*   **💰 Freemium Model with Upgrade Options:**
    *   Free tier with a limit on course creation.
    *   Paid plans via Razorpay integration for increased limits and premium features.
*   **🎨 Modern & Responsive UI:**
    *   Built with Next.js, Tailwind CSS, and Shadcn UI components.
    *   Smooth animations using Framer Motion.
    *   Light/Dark/System theme toggle.
*   **Explore Mode:** Discover courses created by other users.
*   **📁 File Storage:** Firebase Storage for course banners and other assets.
*   **⚡ Fast & Scalable:** Built with a modern full-stack serverless architecture.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v14+ with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Database ORM:** [Drizzle ORM](https://orm.drizzle.team/)
*   **Database:** [NeonDB](https://neon.tech/) (Serverless PostgreSQL)
*   **Authentication:** [Clerk](https://clerk.com/)
*   **AI Model:** [Google Gemini API](https://ai.google.dev/) (via `@google/generative-ai`)
*   **File Storage:** [Firebase Storage](https://firebase.google.com/docs/storage)
*   **Payment Gateway:** [Razorpay](https://razorpay.com/)
*   **Video Search:** [YouTube Data API v3](https://developers.google.com/youtube/v3)
*   **Image Search (Optional):** [Pexels API](https://www.pexels.com/api/) / [Unsplash API](https://unsplash.com/developers)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Theme Management:** [next-themes](https://github.com/pacocoursey/next-themes)
*   **Deployment:** [Vercel](https://vercel.com/) (Recommended)

---

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18.x or later recommended)
*   pnpm (or npm/yarn)
*   A NeonDB PostgreSQL database URL.
*   Google Gemini API Key.
*   Clerk Application Keys (Publishable Key & Secret Key).
*   Firebase Project setup for Storage.
*   YouTube Data API v3 Key.
*   (Optional) Pexels API Key or Unsplash API Key for automatic banner images.
*   (Optional) Razorpay API Keys (Key ID & Key Secret) for payment integration.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    https://github.com/prashant-sagar-shakya/Tutorial-Hub.git
    cd Tutorial-Hub
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of your project and add the following environment variables with your actual keys and URLs:
    ```env
    # App URL
    NEXT_PUBLIC_HOST_URL="http://localhost:3000"

    # Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_CLERK_PUBLISHABLE_KEY"
    CLERK_SECRET_KEY="sk_test_YOUR_CLERK_SECRET_KEY"
    NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
    NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
    # NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
    # NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"


    # Google Gemini AI
    NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"

    # Drizzle ORM & NeonDB (PostgreSQL)
    # Get this from your NeonDB project settings
    NEXT_PUBLIC_DRIZZLE_DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

    # Firebase Storage (Update with your Firebase project config)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID" # Optional

    # YouTube Data API
    NEXT_PUBLIC_YOUTUBE_API_KEY="YOUR_YOUTUBE_API_KEY"

    # Pexels API (for automatic course banners)
    NEXT_PUBLIC_PEXELS_API_KEY="YOUR_PEXELS_API_KEY"

    # Razorpay (for subscriptions/payments)
    NEXT_PUBLIC_RAZORPAY_KEY_ID="YOUR_RAZORPAY_KEY_ID"
    RAZORPAY_KEY_SECRET="YOUR_RAZORPAY_KEY_SECRET"
    ```

4.  **Set up Database Schema:**
    Ensure your NeonDB (or other PostgreSQL database) is running and accessible with the URL provided in `.env.local`.
    Push the Drizzle schema to your database:
    ```bash
    pnpm run db:push
    ```
    This command will create the necessary tables based on `schema/schema.ts`.

5.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📜 Available Scripts

*   `pnpm dev`: Starts the development server.
*   `pnpm build`: Builds the application for production.
*   `pnpm start`: Starts a production server (after running `build`).
*   `pnpm lint`: Runs ESLint for code linting.
*   `pnpm db:push`: Pushes schema changes to your database (uses Drizzle Kit).
*   `pnpm db:studio`: Opens Drizzle Studio to browse your database.
*   `pnpm db:generate`: Generates Drizzle ORM migration files (for more controlled migrations, use instead of `db:push` in production workflows).

---

## 📂 Project Structure (Highlights)

```
.
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (Clerk)
│   ├── course/[courseId]/        # Course viewing/taking pages
│   ├── create-course/            # Course creation flow
│   ├── dashboard/                # User dashboard
│   ├── api/                      # API Routes (e.g., for Razorpay, AI Chat)
│   ├── _components/              # Shared UI components for specific routes/layouts
│   ├── _context/                 # React Context providers
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/
│   └── ui/                       # Shadcn UI components
├── configs/                      # Configuration files (AI models, DB, Firebase, services)
├── drizzle/                      # Drizzle migration files (if generated)
├── lib/                          # Utility functions
├── public/                       # Static assets
├── schema/                       # Drizzle ORM schema definitions (schema.ts)
├── types/                        # TypeScript type definitions
├── .env.local                    # Environment variables (ignored by Git)
├── drizzle.config.ts             # Drizzle Kit configuration
├── middleware.ts                 # Next.js middleware (e.g., for Clerk route protection)
├── next.config.mjs               # Next.js configuration
└── tailwind.config.ts            # Tailwind CSS configuration
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-amazing-feature` or `bugfix/fix-that-bug`.
3.  **Make your changes.**
4.  **Commit your changes** with a clear and descriptive commit message.
5.  **Push your changes** to your forked repository.
6.  **Create a Pull Request** to the main repository, explaining your changes.

Please ensure your code follows the existing coding style and that all tests (if any) pass.

---

## 💡 Future Enhancements / Roadmap (Ideas)

*   [ ] More advanced AI prompting for even richer content.
*   [ ] User ability to regenerate specific chapter content or quiz questions.
*   [ ] Support for different content types (e.g., uploading PDFs, presentations).
*   [ ] Student progress tracking within courses.
*   [ ] Course completion certificates.
*   [ ] Advanced dashboard analytics for course creators.
*   [ ] AI Chat: Streaming responses, syntax highlighting for code, delete/rename sessions.
*   [ ] Community features: Course ratings, reviews, Q&A sections per course.
*   [ ] Internationalization (i18n).

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.

---

Made with ❤️ by **prashant-sagar-shakya**