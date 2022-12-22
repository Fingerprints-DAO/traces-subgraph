import {
  CollectionAdded as CollectionAddedEvent,
  Outbid as OutbidEvent,
  TokenAdded as TokenAddedEvent,
  TokenDeleted as TokenDeletedEvent,
  Traces as TracesContract,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  Transfer as TransferEvent,
} from '../generated/Traces/Traces'
import { TokenAdded, TokenDeleted, Outbid, Transfer } from '../generated/schema'

import { Collection, WNFT, Admin, Editor } from './types/schema'

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

  entity.price = event.params.price
  entity.minHoldPeriod = event.params.minHoldPeriod
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
  wnft.lastPrice = event.params.price
  wnft.firstStakePrice = event.params.price
  wnft.minHoldPeriod = event.params.minHoldPeriod
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

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let tracesContract = TracesContract.bind(event.address)
  // must have 2 equal instead 3
  if (event.params.role == tracesContract.DEFAULT_ADMIN_ROLE()) {
    let user = Admin.load(event.params.account)
    if (user === null) user = new Admin(event.params.account)

    user.sender = event.params.sender
    user.role = event.params.role
    user.blockTimestamp = event.block.timestamp
    user.transactionHash = event.transaction.hash

    user.save()
  }

  // must have 2 equal instead 3
  if (event.params.role == tracesContract.EDITOR_ROLE()) {
    let user = Editor.load(event.params.account)
    if (user === null) user = new Editor(event.params.account)

    user.sender = event.params.sender
    user.role = event.params.role
    user.blockTimestamp = event.block.timestamp
    user.transactionHash = event.transaction.hash

    user.save()
  }
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let tracesContract = TracesContract.bind(event.address)
  if (event.params.role === tracesContract.DEFAULT_ADMIN_ROLE()) {
    let user = Admin.load(event.params.account)

    if (user !== null) {
      user.unset(user.id.toString())
    }
  } else {
    let user = Editor.load(event.params.account)

    if (user !== null) {
      user.unset(user.id.toString())
    }
  }
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let wnft = WNFT.load(event.params.tokenId.toString())
  if (wnft !== null) {
    wnft.currentOwner = event.params.to
    wnft.save()
  }
}
