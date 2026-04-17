# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0a875b17-7695-44b0-8956-ba3ba66b10e5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the
[Lovable Project](https://lovable.dev/projects/0a875b17-7695-44b0-8956-ba3ba66b10e5)
and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push
changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed -
[install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once
  you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open
[Lovable](https://lovable.dev/projects/0a875b17-7695-44b0-8956-ba3ba66b10e5) and
click on Share -> Publish.

## Configure the Token Manager

The landing page includes a token manager at `/tokens`.

Set your Instant app id in `landing-page/.env.local`:

```sh
VITE_INSTANT_APP_ID=your-instant-app-id
```

Without this variable, the token manager cannot authenticate or write token
hashes to InstantDB.

## Configure the Get Started link

The landing page "Get Started" buttons use `VITE_INSTANTDB_APP_URL`.
If omitted, it defaults to `/tokens`.

Create `landing-page/.env.local` with:

```sh
VITE_INSTANTDB_APP_URL=https://your-instantdb-app.example.com
```

If this variable is not set, the button falls back to `/tokens`.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under
your own domain then we recommend using Netlify. Visit our docs for more
details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
