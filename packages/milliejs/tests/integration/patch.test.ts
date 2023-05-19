import MillieJS, { Entity, Query, Resource } from "../../src/index"
import MillieMemoryStore from "@milliejs/store-memory"
import {
  makeMockEntity,
  makeMockQuery,
  makeMockResource,
} from "@milliejs/jest-utils"

const mockResource = makeMockResource({})
const mockQuery = makeMockQuery({
  resource: mockResource,
  cardinality: "many",
  attributes: {
    a: "a",
  },
})
const mockEntity = makeMockEntity({
  resource: mockResource,
  data: {
    a: "a",
  },
})
const patch = [
  {
    op: "replace",
    path: "/a",
    value: "AAA",
  },
]

describe("Millie patch", () => {
  let millie: MillieJS
  let replicaStore: MillieMemoryStore
  let sourcePublisher: MillieMemoryStore
  beforeEach(() => {
    millie = new MillieJS()
    replicaStore = new MillieMemoryStore({})
    sourcePublisher = new MillieMemoryStore({})
    millie.registerResource(mockResource, replicaStore, {
      sourcePublisher,
    })
  })

  describe("when the client patches entities", () => {
    describe.each<[string, Entity<Resource> | Query]>([
      ["a query", mockQuery],
      ["an entity", mockEntity],
    ])("via %s", (_, entityOrQueryProp) => {
      it("patches the entities in the replicaStore", () => {
        const spy = jest.spyOn(replicaStore, "patch")

        millie.patch(mockResource, entityOrQueryProp, patch)
        expect(spy).toHaveBeenCalledWith(entityOrQueryProp, patch)
      })

      describe("when the replicaStore request takes a while", () => {
        beforeEach(() => {
          jest
            .spyOn(replicaStore, "patch")
            .mockImplementation((entityOrQuery) => {
              return new Promise<any>((resolve) => {
                setTimeout(() => {
                  resolve([mockEntity])
                }, 1000)
              })
            })
        })

        it("still patches the entities in the source optimistically", () => {
          const spy = jest.spyOn(sourcePublisher, "patch")

          millie.patch(mockResource, entityOrQueryProp, patch)
          expect(spy).toHaveBeenCalledWith(entityOrQueryProp, patch)
        })

        describe("after the source succeeds with the patch and returns the patched entities", () => {
          it.todo("updates the entities in the replicaStore")
        })
      })

      it("patches the entities in the source", () => {
        const spy = jest.spyOn(sourcePublisher, "patch")

        millie.patch(mockResource, entityOrQueryProp, patch)

        expect(spy).toHaveBeenCalledWith(entityOrQueryProp, patch)
      })

      describe("after the source succeeds with the patch and returns the patched entities", () => {
        it.todo("updates the entities in the replicaStore")
      })

      describe("when the source request takes a while", () => {
        beforeEach(() => {
          jest
            .spyOn(sourcePublisher, "patch")
            .mockImplementation((entityOrQuery) => {
              return new Promise<any>((resolve) => {
                setTimeout(() => {
                  resolve([mockEntity])
                }, 1000)
              })
            })
        })

        it("still patches the entities in the replicaStore optimistically", () => {
          const spy = jest.spyOn(replicaStore, "patch")

          millie.patch(mockResource, entityOrQueryProp, patch)
          expect(spy).toHaveBeenCalledWith(entityOrQueryProp, patch)
        })
      })
    })
  })

  describe("when the source patches entities", () => {
    it.todo("patches the entities in the replicaStore")
  })
})
