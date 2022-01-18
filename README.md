<h1 style="text-align: center;">👾<br />Pod Monster</h1>

[Pod Monster](https://pod.monster/) is a front-end implementation of many, but not all, of the features specified in new podcast namespace a.k.a. Podcasting 2.0.

The following documentation is meant for developers trying to run this project. If you're attempting to learn more about Pod Monster itself, please visit the [About page](https://pod.monster/about).

## Getting Started

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

1. ### Install dependencies

   Make sure you're running the version of Node specified in the `~/.nvmrc` file (currently "v16") before installing dependencies. If you use `nvm`, you can do this with `nvm use`.

   Then, install dependencies:

   ```bash
   nvm use # if you use nvm
   npm install
   ```

2. ### Setup environment variables at `~/.env.local`

   Create a file named ".env.local" at the root of the project with the following contents:

   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_PODCAST_INDEX_API_KEY=
   NEXT_PUBLIC_PODCAST_INDEX_API_SECRET=
   ```

   #### **Getting your Podcast Index API Key and Secret**

   You will need to obtain your Podcast Index API Key and Secret from your Podcastindex.org account:

   1. [Log in or sign up here.](https://api.podcastindex.org/)
   2. In the "API Keys" section, click the "+" button to create a new API key / secret pair.
   3. Copy the "Key" and paste it to the right of `NEXT_PUBLIC_PODCAST_INDEX_API_KEY=`
   4. Copy the "Secret" and paste it to the right of `NEXT_PUBLIC_PODCAST_INDEX_API_SECRET=`

   Depending on the characters used in your values, may need to enclose the API Key or Secret in double-quotes within the `~/.env.local` file.

   **Example**

   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_PODCAST_INDEX_API_KEY=ABC123DEF456GHI789
   NEXT_PUBLIC_PODCAST_INDEX_API_SECRET="A7ndhfE7u#J7s3ud9fF7j8sS7eJiU^evk7yvBF"
   ```

3. ### Run the development server

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Mobile testing

In order to see the development server from your mobile device, you will need your computer's internal IP address.

1. [Find your internal IP address](https://lifehacker.com/how-to-find-your-local-and-external-ip-address-5833108) and replace the value of `NEXT_PUBLIC_BASE_URL` in your `~/.env.local` file with this IP address.
2. Open the `~/next.config.js` file, and add this IP address to the `nextConfig.images.domains` array. **Never check-in this change.**
3. Visit the IP address on your phone, adding port `:3000` to the end, e.g., `192.168.9.46:3000`

## Learn More

To learn more about Next.js, the Podcast Index, and other related projects, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Podcast Index Developer Portal](https://api.podcastindex.org/) - log in or sign up to access your API Key and Secret.
- [Podcast Index API Documentation](https://podcastindex-org.github.io/docs-api/#overview--libraries) - documentation for the publicly hosted Podcast Index API.
- [The Podcast Namespace](https://github.com/Podcastindex-org/podcast-namespace) - documentation for the podcast namespace specification.
