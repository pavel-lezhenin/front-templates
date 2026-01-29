# Naming Convention

## Pattern

```
{framework}-{pattern|technology}-{project}[-{role}]
```

## Segments

| Segment    | Description                           | Examples                                               |
| ---------- | ------------------------------------- | ------------------------------------------------------ |
| framework  | Base framework                        | `react`, `angular`                                     |
| pattern    | Architecture pattern                  | `fsd`, `modular`, `atomic`, `standalone`, `layered`, `ngrx`, `nx` |
| technology | Technology stack (instead of pattern) | `web3`, `mf`, `next`, `firebase`                       |
| project    | Project name/type                     | `starter`, `ecommerce`, `admin`, `shop`                |
| role       | MF role (optional)                    | `shell`, `remote`, `shared`, `e2e`                     |

## Examples

### Regular Projects

| Name                         | Description                        |
| ---------------------------- | ---------------------------------- |
| `react-fsd-starter`          | React + FSD template               |
| `react-fsd-ecommerce`        | React + FSD implementation         |
| `react-modular-starter`      | React + Modular template           |
| `react-atomic-starter`       | React + Atomic Design              |
| `angular-standalone-starter` | Angular Standalone Components      |
| `angular-modular-starter`    | Angular + NgModules (classic)      |
| `angular-layered-starter`    | Angular Enterprise Layered (300+)  |
| `angular-ngrx-starter`       | Angular + NgRx                     |
| `angular-nx-enterprise`      | Angular + Nx workspace             |

### With Technology Suffix

| Name                             | Description               |
| -------------------------------- | ------------------------- |
| `react-fsd-starter-next`         | React + FSD + Next.js SSR |
| `react-fsd-starter-firebase`     | React + FSD + Firebase    |
| `angular-standalone-starter-ssr` | Angular + SSR (Universal) |

### Web3 Projects

| Name                       | Description                  |
| -------------------------- | ---------------------------- |
| `react-web3-wagmi-starter` | React + wagmi + viem         |
| `react-web3-ethers-defi`   | React + ethers.js + DeFi app |

### Micro-Frontend Projects

| Name                    | Description                |
| ----------------------- | -------------------------- |
| `react-mf-shop-shell`   | MF host application        |
| `react-mf-shop-catalog` | MF remote: product catalog |
| `react-mf-shop-cart`    | MF remote: shopping cart   |
| `react-mf-shop-shared`  | MF shared libraries        |
| `react-mf-shop-e2e`     | MF system E2E tests        |

### Nx Workspaces

| Name                    | Description         |
| ----------------------- | ------------------- |
| `react-nx-enterprise`   | React Nx monorepo   |
| `angular-nx-enterprise` | Angular Nx monorepo |

## Rules

### 1. Framework First

Always start with framework name for easy alphabetical grouping.

### 2. Pattern vs Technology

- Use **pattern** when architecture is the focus: `fsd`, `modular`, `atomic`
- Use **technology** when tech stack is the focus: `web3`, `mf`, `next`

### 3. Suffix for Additions

When adding technology to existing pattern, use suffix:

```
react-fsd-starter        → Base
react-fsd-starter-next   → With Next.js
react-fsd-starter-docker → With Docker
```

### 4. MF Roles

Micro-frontend packages always end with role:

- `-shell` — host application
- `-{feature}` — remote module (catalog, cart, auth)
- `-shared` — shared dependencies
- `-e2e` — end-to-end tests

### 5. Consistency

Same system = same prefix:

```
react-mf-shop-shell
react-mf-shop-catalog
react-mf-shop-cart
react-mf-shop-e2e
```

## Sorting

Alphabetical sorting automatically groups:

```
angular-*
react-atomic-*
react-fsd-*
react-mf-*
react-modular-*
react-nx-*
react-web3-*
```
