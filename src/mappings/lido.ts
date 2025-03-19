import {
  Submitted as DepositEvent,
  Withdrawn as WithdrawalEvent,
  FeeCollected
} from "../../generated/LidoStaking/LidoStaking"
import {
  Deposit,
  Withdrawal,
  DailyRevenueMetric,
  Protocol
} from "../../generated/schema"
import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts"

const PROTOCOL_ID = "lido"
const SECONDS_PER_DAY = 86400
const BIGDECIMAL_ZERO = BigDecimal.fromString("0")
const BIGINT_ZERO = BigInt.fromI32(0)
const ETH_DECIMALS = BigDecimal.fromString("1000000000000000000") // 1e18

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_ID)
  if (!protocol) {
    protocol = new Protocol(PROTOCOL_ID)
    protocol.name = "Lido"
    protocol.totalValueLockedETH = BIGDECIMAL_ZERO
    protocol.totalFeesCollectedETH = BIGDECIMAL_ZERO
    protocol.totalDepositsETH = BIGDECIMAL_ZERO
    protocol.totalWithdrawalsETH = BIGDECIMAL_ZERO
    protocol.lastUpdateTimestamp = BIGINT_ZERO
  }
  return protocol
}

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
    metric.uniqueDepositors = BIGINT_ZERO
    metric.uniqueWithdrawers = BIGINT_ZERO
    metric.transactionCount = BIGINT_ZERO
  }
  return metric
}

export function handleDeposit(event: DepositEvent): void {
  let deposit = new Deposit(event.transaction.hash.toHexString())
  deposit.user = event.params.sender
  deposit.amount = event.params.amount
  deposit.sharesMinted = BIGINT_ZERO // Since shares are not provided in the event
  deposit.timestamp = event.block.timestamp
  deposit.blockNumber = event.block.number
  deposit.transactionHash = event.transaction.hash
  deposit.save()

  // Update daily metrics
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  let amountInETH = event.params.amount.toBigDecimal().div(ETH_DECIMALS)
  dailyMetric.totalDepositsETH = dailyMetric.totalDepositsETH.plus(amountInETH)
  dailyMetric.netFlowETH = dailyMetric.totalDepositsETH.minus(dailyMetric.totalWithdrawalsETH)
  dailyMetric.transactionCount = dailyMetric.transactionCount.plus(BigInt.fromI32(1))
  dailyMetric.save()

  // Update protocol metrics
  let protocol = getOrCreateProtocol()
  protocol.totalDepositsETH = protocol.totalDepositsETH.plus(amountInETH)
  protocol.totalValueLockedETH = protocol.totalValueLockedETH.plus(amountInETH)
  protocol.lastUpdateTimestamp = event.block.timestamp
  protocol.save()
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  let withdrawal = new Withdrawal(event.transaction.hash.toHexString())
  withdrawal.user = event.transaction.from
  withdrawal.amount = event.params.amount
  withdrawal.sharesBurned = event.params.shares
  withdrawal.timestamp = event.block.timestamp
  withdrawal.blockNumber = event.block.number
  withdrawal.transactionHash = event.transaction.hash
  withdrawal.save()

  // Update daily metrics
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  let amountInETH = event.params.amount.toBigDecimal().div(ETH_DECIMALS)
  dailyMetric.totalWithdrawalsETH = dailyMetric.totalWithdrawalsETH.plus(amountInETH)
  dailyMetric.netFlowETH = dailyMetric.totalDepositsETH.minus(dailyMetric.totalWithdrawalsETH)
  dailyMetric.transactionCount = dailyMetric.transactionCount.plus(BigInt.fromI32(1))
  dailyMetric.save()

  // Update protocol metrics
  let protocol = getOrCreateProtocol()
  protocol.totalWithdrawalsETH = protocol.totalWithdrawalsETH.plus(amountInETH)
  protocol.totalValueLockedETH = protocol.totalValueLockedETH.minus(amountInETH)
  protocol.lastUpdateTimestamp = event.block.timestamp
  protocol.save()
}

export function handleFeeCollection(event: FeeCollected): void {
  let dailyMetric = getOrCreateDailyMetric(event.block.timestamp)
  let feeAmount = event.params.amount.toBigDecimal().div(ETH_DECIMALS)
  
  dailyMetric.feesCollectedETH = dailyMetric.feesCollectedETH.plus(feeAmount)
  dailyMetric.totalRevenueETH = dailyMetric.totalRevenueETH.plus(feeAmount)
  dailyMetric.save()

  // Update protocol metrics
  let protocol = getOrCreateProtocol()
  protocol.totalFeesCollectedETH = protocol.totalFeesCollectedETH.plus(feeAmount)
  protocol.lastUpdateTimestamp = event.block.timestamp
  protocol.save()
}
