# antilatency.github.io

## FullBand web deployment

The FullBand web application is maintained in
[`antilatency/Antilatency.Light`](https://github.com/antilatency/Antilatency.Light/tree/main/web).

The [GitHub Pages workflow](.github/workflows/deploy-pages.yml) checks out only
the `web` directory and publishes it at `fullband/web`.

Deployment runs only when:

- a commit is pushed to the `master` branch of this repository; or
- the `Deploy GitHub Pages` workflow is started manually.

