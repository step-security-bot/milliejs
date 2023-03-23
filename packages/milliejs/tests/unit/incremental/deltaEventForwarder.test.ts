import type { Entity, Resource } from "@milliejs/core"
import { LifecycleEvents, SubscriberActionInterface } from "@milliejs/store-base"
import { IncrementalStore } from "../../../src/incremental"
import { deltaEventForwarder } from "../../../src/incremental/deltaEventForwarder"
import { makeMockPublisherWithEvents } from "../mocks/publisher"
import { makeMockSubscriber } from "../mocks/subscriber"

type MockResource = Resource
const mockResource: MockResource = {
  id: "MOCK RESOURCE",
}

const mockReplicaStore = makeMockPublisherWithEvents()

describe("deltaEventForwarder", () => {
  let mockStore: IncrementalStore<MockResource>
  let mockSubscriber: SubscriberActionInterface
  beforeEach(() => {
    mockStore = new IncrementalStore<MockResource>(
      mockResource,
      mockReplicaStore,
    )
    mockSubscriber = makeMockSubscriber()

    deltaEventForwarder(mockStore, mockSubscriber)
  })

  describe.each([[LifecycleEvents.Save], [LifecycleEvents.Delete]])(
    "when the store emits a '%s' event",
    (event) => {
      describe("when the store's resource and the event's resource match", () => {
        it(`re-emits the '${event}' event from the incremental store`, (done) => {
          expect.assertions(2)

          const mockEntity: Entity<MockResource> = {
            id: "a",
            resource: mockResource,
            data: {},
          }

          mockStore.on(
            event,
            (resource: MockResource, entity: Entity<MockResource>) => {
              try {
                expect(resource).toBe(mockResource)
                expect(entity).toBe(mockEntity)
                done()
              } catch (error) {
                done(error)
              }
            },
          )
          mockSubscriber.emit(event, mockEntity)
        })

        it(`emits the '${LifecycleEvents.Delta}' event from the incremental store`, (done) => {
          expect.assertions(2)

          const mockEntity: Entity<MockResource> = {
            id: "a",
            resource: mockResource,
            data: {},
          }

          mockStore.on(
            LifecycleEvents.Delta,
            (resource: MockResource, entity: Entity<MockResource>) => {
              try {
                expect(resource).toBe(mockResource)
                expect(entity).toBe(mockEntity)
                done()
              } catch (error) {
                done(error)
              }
            },
          )
          mockSubscriber.emit(event, mockEntity)
        })
      })

      describe("when the store's resource and the event's resource don't match", () => {
        it("throws an error", (done) => {
          expect.assertions(1)

          type AnotherMockResource = Resource
          const mockResource2: AnotherMockResource = {
            id: "ANOTHER MOCK RESOURCE",
          }
          const mockEntity: Entity<AnotherMockResource> = {
            id: "a",
            resource: mockResource2,
            data: {},
          }

          mockSubscriber.on("error", (error: Error) => {
            try {
              expect(error).toHaveProperty(
                "message",
                expect.stringContaining(
                  "Subscriber Resource is for another Incremental Store",
                ),
              )
              done()
            } catch (error) {
              done(error)
            }
          })

          mockSubscriber.emit(event, mockEntity)
        })
      })
    },
  )
})
