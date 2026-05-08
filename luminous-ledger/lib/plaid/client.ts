import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const env = process.env.PLAID_ENV ?? 'sandbox'

const plaidEnvMap: Record<string, string> = {
  sandbox:     PlaidEnvironments.sandbox,
  development: PlaidEnvironments.development,
  production:  PlaidEnvironments.production,
}

const config = new Configuration({
  basePath: plaidEnvMap[env] ?? PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET':    process.env.PLAID_SECRET!,
    },
  },
})

export const plaidClient = new PlaidApi(config)
export const plaidEnv = env
