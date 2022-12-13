import {
  CollectionAdded as CollectionAddedEvent,
  Outbid as OutbidEvent,
  TokenAdded as TokenAddedEvent,
  TokenDeleted as TokenDeletedEvent,
  Traces as TracesContract,
} from '../generated/Traces/Traces'
import { TokenAdded, TokenDeleted, Outbid } from '../generated/schema'

import { Collection, WNFT } from './types/schema'

export function handleCollectionAdded(event: CollectionAddedEvent): void {
  let collection = Collection.load(event.params.collectionId.toString())
  if (collection === null) {
    collection = new Collection(event.params.collectionId.toString())
  }
  collection.ogTokenAddress = event.params.ogTokenAddress.toHexString()
  collection.blockTimestamp = event.block.timestamp
  collection.save()
}

export function handleTokenAdded(event: TokenAddedEvent): void {
  let entity = new TokenAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.ogTokenAddress = event.params.ogTokenAddress
  entity.ogTokenId = event.params.ogTokenId
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let wnft = WNFT.load(event.params.tokenId.toString())
  if (wnft === null) {
    wnft = new WNFT(event.params.tokenId.toString())
  }

  wnft.ogTokenAddress = event.params.ogTokenAddress.toHexString()
  wnft.ogTokenId = event.params.ogTokenId
  wnft.tokenId = event.params.tokenId
  wnft.lastPrice = event.params.param3
  wnft.firstStakePrice = event.params.param3
  wnft.minHoldPeriod = event.params.param4
  wnft.blockTimestamp = event.block.timestamp

  let tracesContract = TracesContract.bind(event.address)
  const collection = tracesContract.collection(event.params.ogTokenAddress)
  wnft.collection = collection.getId().toString()
  wnft.currentOwner = tracesContract._address

  wnft.save()
}

export function handleTokenDeleted(event: TokenDeletedEvent): void {
  let entity = new TokenDeleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.ogTokenAddress = event.params.ogTokenAddress
  entity.ogTokenId = event.params.ogTokenId
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let wnft = WNFT.load(event.params.tokenId.toString())
  // if wnft is not null, delete it
  if (wnft !== null) {
    wnft.unset(wnft.id)
  }
}

export function handleOutbid(event: OutbidEvent): void {
  let entity = new Outbid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.ogTokenAddress = event.params.ogTokenAddress
  entity.ogTokenId = event.params.ogTokenId
  entity.tokenId = event.params.tokenId
  entity.amount = event.params.amount
  entity.price = event.params.price
  entity.owner = event.params.owner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let wnft = WNFT.load(event.params.tokenId.toString())
  if (wnft === null) wnft = new WNFT(event.params.tokenId.toString())

  wnft.currentOwner = event.params.owner
  wnft.lastPrice = event.params.amount

  wnft.save()
}
