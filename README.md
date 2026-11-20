# cube

[![Build and deploy](https://github.com/andrewmacheret/cube/actions/workflows/deploy.yml/badge.svg)](https://github.com/andrewmacheret/cube/actions/workflows/deploy.yml) [![License](https://img.shields.io/badge/license-MIT-lightgray.svg)](https://github.com/andrewmacheret/cube/blob/master/LICENSE.md)

A mobile-friendly web-based Rubik's Cube with a built-in solver, using [React](https://react.dev/) and [three.js](https://threejs.org/).

Drag a face to turn it, or drag outside the cube to spin the whole thing. Works with a mouse, touch or a pen. While Solve is running, a slider sets how fast it plays its moves. The top right shows how many moves the solver needs from the current position.

See it running at [andrewmacheret.com/projects/cube](https://andrewmacheret.com/projects/cube/).

![Cube image](public/cube2.png?raw=true "Cube image")

## Development

Built with [Vite](https://vite.dev/). Needs Node.js 24.

```bash
npm install

# dev server on http://localhost:5173
npm run dev

# solver tests: shuffles 500 cubes and checks each one gets solved
npm test

# production build in dist/
npm run build
```

## Deploy

Pushes to `master` run the tests, build the site, copy `dist/` to `s3://andrewmacheret.com/projects/cube`, and clear the CloudFront cache through GitHub Actions (see `.github/workflows/deploy.yml`). The workflow signs in to AWS with GitHub OIDC using the IAM role in the `AWS_ROLE_ARN` repo variable.
