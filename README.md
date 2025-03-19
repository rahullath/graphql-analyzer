# graphql-analyzer
Using GRT to analyze protocol metrics 

# Lido Revenue Metrics Subgraph

This subgraph indexes revenue-related data from Lido protocol on Ethereum mainnet, tracking deposits, withdrawals, and fees to provide comprehensive revenue metrics.

## Metrics Tracked

- Daily/Total Revenue
- Fees Collected
- Total Deposits/Withdrawals
- Net Flow (Deposits - Withdrawals)
- Unique Users
- Transaction Counts
- APY Metrics

## Contracts Indexed

- Lido Staking Contract (stETH): `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`
- Withdrawal Contract: `0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1`

## Setup & Deployment

1. Install dependencies:
```bash
npm install
```

2. Generate types:
```bash
npm run codegen
```

3. Build subgraph:
```bash
npm run build
```

4. Deploy to The Graph Studio:
```bash
npm run deploy
```

## Example Queries

### Daily Revenue Metrics
```graphql
{
  dailyRevenueMetrics(
    first: 7
    orderBy: date
    orderDirection: desc
  ) {
    date
    totalRevenueETH
    feesCollectedETH
    totalDepositsETH
    totalWithdrawalsETH
    netFlowETH
    uniqueDepositors
    uniqueWithdrawers
    transactionCount
  }
}
```

### Protocol Overview
```graphql
{
  protocol(id: "lido") {
    totalValueLockedETH
    totalFeesCollectedETH
    totalDepositsETH
    totalWithdrawalsETH
    lastUpdateTimestamp
  }
}
```

### Recent Deposits
```graphql
{
  deposits(
    first: 10
    orderBy: timestamp
    orderDirection: desc
  ) {
    user
    amount
    sharesMinted
    timestamp
    transactionHash
  }
}
```

### Recent Withdrawals
```graphql
{
  withdrawals(
    first: 10
    orderBy: timestamp
    orderDirection: desc
  ) {
    user
    amount
    sharesBurned
    timestamp
    transactionHash
  }
}
```

## Development

To run locally:

1. Install Graph CLI:
```bash
npm install -g @graphprotocol/graph-cli
```

2. Run codegen when schema changes:
```bash
npm run codegen
```

3. Build subgraph:
```bash
npm run build
```

## License

MIT
