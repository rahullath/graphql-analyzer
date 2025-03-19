import {
  WithdrawalRequested,
  WithdrawalCompleted
} from "../../generated/WithdrawalContract/WithdrawalContract"
import {
  Withdrawal,
  DailyRevenueMetric,
  Protocol
} from "../../generated/schema"
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

const PROTOCOL_ID = "lido"
const SECONDS_PER_DAY = 86400
const BIGDECIMAL_ZERO = BigDecimal.fromString("0")
const ETH_DECIMALS = BigDecimal.fromString("1000000000000000000") // 1e18

function getOrCreateDailyMetric(timestamp: BigInt): DailyRevenueMetric {
  let dayID = timestamp.toI32() / SECONDS_PER_DAY
  let id = dayID.toString()
  
  let metric = DailyRevenueMetric.load(id)
  if (!metric) {
    metric = new DailyRevenueMetric(id)
    metric.date = dayID.toString()
    metric.totalRevenueETH = BIGDECIMAL_ZERO
    metric.feesCollectedETH = BIGDECIMAL_ZERO
    metric.totalDepositsETH = BIGDECIMAL_ZERO
    metric.totalWithdrawalsETH = BIGDECIMAL_ZERO
    metric.netFlowETH = BIGDECIMAL_ZERO
    metric.averageAPY = BIGDECIMAL_ZERO
    metric.uniqueDepositors = BigInt.fromI32(0)
    metric.uniqueWithdrawers = BigInt.fromI32(0)
    metric.transactionCount = BigInt.fromI32(0)
  }
  return metric
}

export function handleWithdrawalRequest(event: WithdrawalRequested): void {
  let withdrawal = new Withdrawal(event.transaction.hash.toHexString())
  withdrawal.user = event.params.requestor
  withdrawal.amount = event.params.amount
  withdrawal.sharesBurned = event.params.shares
  withdrawal.timestamp = event.block.timestamp
  withdrawal.blockNumber = event.block.number
  withdrawal.transactionHash = event.transaction.hash
  withdrawal.save()

  // Update daily metrics
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  dailyMetric.transactionCount = dailyMetric.transactionCount.plus(BigInt.fromI32(1))
  dailyMetric.uniqueWithdrawers = dailyMetric.uniqueWithdrawers.plus(BigInt.fromI32(1))
  dailyMetric.save()
}

export function handleWithdrawalCompleted(event: WithdrawalCompleted): void {
  let amountInETH = event.params.amount.toBigDecimal().div(ETH_DECIMALS)
  
  // Update daily metrics
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  dailyMetric.totalWithdrawalsETH = dailyMetric.totalWithdrawalsETH.plus(amountInETH)
  dailyMetric.netFlowETH = dailyMetric.totalDepositsETH.minus(dailyMetric.totalWithdrawalsETH)
  dailyMetric.save()

  // Update protocol metrics
  let protocol = Protocol.load(PROTOCOL_ID)
  if (protocol) {
    protocol.totalWithdrawalsETH = protocol.totalWithdrawalsETH.plus(amountInETH)
    protocol.totalValueLockedETH = protocol.totalValueLockedETH.minus(amountInETH)
    protocol.lastUpdateTimestamp = event.block.timestamp
    protocol.save()
  }
}
