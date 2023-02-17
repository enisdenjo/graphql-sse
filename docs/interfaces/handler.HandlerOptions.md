[graphql-sse](../README.md) / [handler](../modules/handler.md) / HandlerOptions

# Interface: HandlerOptions<RequestRaw, RequestContext, Context\>

[handler](../modules/handler.md).HandlerOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `RequestRaw` | `unknown` |
| `RequestContext` | `unknown` |
| `Context` | extends [`OperationContext`](../modules/handler.md#operationcontext) = `undefined` |

## Table of contents

### Properties

- [authenticate](handler.HandlerOptions.md#authenticate)
- [context](handler.HandlerOptions.md#context)
- [execute](handler.HandlerOptions.md#execute)
- [onComplete](handler.HandlerOptions.md#oncomplete)
- [onConnect](handler.HandlerOptions.md#onconnect)
- [onNext](handler.HandlerOptions.md#onnext)
- [onOperation](handler.HandlerOptions.md#onoperation)
- [onSubscribe](handler.HandlerOptions.md#onsubscribe)
- [schema](handler.HandlerOptions.md#schema)
- [subscribe](handler.HandlerOptions.md#subscribe)
- [validate](handler.HandlerOptions.md#validate)

## Properties

### authenticate

• `Optional` **authenticate**: (`req`: [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\>) => `undefined` \| ``null`` \| `string` \| [`Response`](../modules/handler.md#response) \| `Promise`<`undefined` \| ``null`` \| `string` \| [`Response`](../modules/handler.md#response)\>

#### Type declaration

▸ (`req`): `undefined` \| ``null`` \| `string` \| [`Response`](../modules/handler.md#response) \| `Promise`<`undefined` \| ``null`` \| `string` \| [`Response`](../modules/handler.md#response)\>

Authenticate the client. Returning a string indicates that the client
is authenticated and the request is ready to be processed.

A distinct token of type string must be supplied to enable the "single connection mode".

Providing `null` as the token will completely disable the "single connection mode"
and all incoming requests will always use the "distinct connection mode".

**`Default`**

'req.headers["x-graphql-event-stream-token"] || req.url.searchParams["token"] || generateRandomUUID()' // https://gist.github.com/jed/982883

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\> |

##### Returns

`undefined` \| ``null`` \| `string` \| [`Response`](../modules/handler.md#response) \| `Promise`<`undefined` \| ``null`` \| `string` \| [`Response`](../modules/handler.md#response)\>

___

### context

• `Optional` **context**: `Context` \| (`req`: [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\>, `params`: [`RequestParams`](common.RequestParams.md)) => `Context` \| `Promise`<`Context`\>

A value which is provided to every resolver and holds
important contextual information like the currently
logged in user, or access to a database.

Note that the context function is invoked on each operation only once.
Meaning, for subscriptions, only at the point of initialising the subscription;
not on every subscription event emission. Read more about the context lifecycle
in subscriptions here: https://github.com/graphql/graphql-js/issues/894.

If you don't provide the context context field, but have a context - you're trusted to
provide one in `onSubscribe`.

___

### execute

• `Optional` **execute**: (`args`: [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\>) => [`OperationResult`](../modules/handler.md#operationresult)

#### Type declaration

▸ (`args`): [`OperationResult`](../modules/handler.md#operationresult)

Is the `execute` function from GraphQL which is
used to execute the query and mutation operations.

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\> |

##### Returns

[`OperationResult`](../modules/handler.md#operationresult)

___

### onComplete

• `Optional` **onComplete**: (`ctx`: `Context`, `req`: [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\>) => `void` \| `Promise`<`void`\>

#### Type declaration

▸ (`ctx`, `req`): `void` \| `Promise`<`void`\>

The complete callback is executed after the operation
has completed and the client has been notified.

Since the library makes sure to complete streaming
operations even after an abrupt closure, this callback
will always be called.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ctx` | `Context` | - |
| `req` | [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\> | Always the request that contains the GraphQL operation. |

##### Returns

`void` \| `Promise`<`void`\>

___

### onConnect

• `Optional` **onConnect**: (`req`: [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\>) => `undefined` \| ``null`` \| `void` \| [`Response`](../modules/handler.md#response) \| `Promise`<`undefined` \| ``null`` \| `void` \| [`Response`](../modules/handler.md#response)\>

#### Type declaration

▸ (`req`): `undefined` \| ``null`` \| `void` \| [`Response`](../modules/handler.md#response) \| `Promise`<`undefined` \| ``null`` \| `void` \| [`Response`](../modules/handler.md#response)\>

Called when a new event stream is connecting BEFORE it is accepted.
By accepted, its meant the server processed the request and responded
with a 200 (OK), alongside flushing the necessary event stream headers.

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\> |

##### Returns

`undefined` \| ``null`` \| `void` \| [`Response`](../modules/handler.md#response) \| `Promise`<`undefined` \| ``null`` \| `void` \| [`Response`](../modules/handler.md#response)\>

___

### onNext

• `Optional` **onNext**: (`ctx`: `Context`, `req`: [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\>, `result`: [`ExecutionResult`](common.ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](common.ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\>) => `void` \| [`ExecutionResult`](common.ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](common.ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\> \| `Promise`<`void` \| [`ExecutionResult`](common.ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](common.ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\>\>

#### Type declaration

▸ (`ctx`, `req`, `result`): `void` \| [`ExecutionResult`](common.ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](common.ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\> \| `Promise`<`void` \| [`ExecutionResult`](common.ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](common.ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\>\>

Executed after an operation has emitted a result right before
that result has been sent to the client.

Results from both single value and streaming operations will
invoke this callback.

Use this callback if you want to format the execution result
before it reaches the client.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ctx` | `Context` | - |
| `req` | [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\> | Always the request that contains the GraphQL operation. |
| `result` | [`ExecutionResult`](common.ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](common.ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\> | - |

##### Returns

`void` \| [`ExecutionResult`](common.ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](common.ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\> \| `Promise`<`void` \| [`ExecutionResult`](common.ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](common.ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\>\>

___

### onOperation

• `Optional` **onOperation**: (`ctx`: `Context`, `req`: [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\>, `args`: `ExecutionArgs`, `result`: [`OperationResult`](../modules/handler.md#operationresult)) => `void` \| [`OperationResult`](../modules/handler.md#operationresult) \| `Promise`<`void` \| [`OperationResult`](../modules/handler.md#operationresult)\>

#### Type declaration

▸ (`ctx`, `req`, `args`, `result`): `void` \| [`OperationResult`](../modules/handler.md#operationresult) \| `Promise`<`void` \| [`OperationResult`](../modules/handler.md#operationresult)\>

Executed after the operation call resolves. For streaming
operations, triggering this callback does not necessarely
mean that there is already a result available - it means
that the subscription process for the stream has resolved
and that the client is now subscribed.

The `OperationResult` argument is the result of operation
execution. It can be an iterator or already a value.

If you want the single result and the events from a streaming
operation, use the `onNext` callback.

If `onSubscribe` returns an `OperationResult`, this hook
will NOT be called.

##### Parameters

| Name | Type |
| :------ | :------ |
| `ctx` | `Context` |
| `req` | [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\> |
| `args` | `ExecutionArgs` |
| `result` | [`OperationResult`](../modules/handler.md#operationresult) |

##### Returns

`void` \| [`OperationResult`](../modules/handler.md#operationresult) \| `Promise`<`void` \| [`OperationResult`](../modules/handler.md#operationresult)\>

___

### onSubscribe

• `Optional` **onSubscribe**: (`req`: [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\>, `params`: [`RequestParams`](common.RequestParams.md)) => `void` \| [`Response`](../modules/handler.md#response) \| [`OperationResult`](../modules/handler.md#operationresult) \| [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\> \| `Promise`<`void` \| [`Response`](../modules/handler.md#response) \| [`OperationResult`](../modules/handler.md#operationresult) \| [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\>\>

#### Type declaration

▸ (`req`, `params`): `void` \| [`Response`](../modules/handler.md#response) \| [`OperationResult`](../modules/handler.md#operationresult) \| [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\> \| `Promise`<`void` \| [`Response`](../modules/handler.md#response) \| [`OperationResult`](../modules/handler.md#operationresult) \| [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\>\>

The subscribe callback executed right after processing the request
before proceeding with the GraphQL operation execution.

If you return `ExecutionArgs` from the callback, it will be used instead of
trying to build one internally. In this case, you are responsible for providing
a ready set of arguments which will be directly plugged in the operation execution.

Omitting the fields `contextValue` from the returned `ExecutionArgs` will use the
provided `context` option, if available.

If you want to respond to the client with a custom status or body,
you should do so using the provided `res` argument which will stop
further execution.

Useful for preparing the execution arguments following a custom logic. A typical
use-case is persisted queries. You can identify the query from the request parameters
and supply the appropriate GraphQL operation execution arguments.

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\> |
| `params` | [`RequestParams`](common.RequestParams.md) |

##### Returns

`void` \| [`Response`](../modules/handler.md#response) \| [`OperationResult`](../modules/handler.md#operationresult) \| [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\> \| `Promise`<`void` \| [`Response`](../modules/handler.md#response) \| [`OperationResult`](../modules/handler.md#operationresult) \| [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\>\>

___

### schema

• `Optional` **schema**: `GraphQLSchema` \| (`req`: [`Request`](handler.Request.md)<`RequestRaw`, `RequestContext`\>, `args`: `Pick`<[`OperationArgs`](../modules/handler.md#operationargs)<`Context`\>, ``"contextValue"`` \| ``"operationName"`` \| ``"document"`` \| ``"variableValues"``\>) => `GraphQLSchema` \| `Promise`<`GraphQLSchema`\>

The GraphQL schema on which the operations will
be executed and validated against.

If a function is provided, it will be called on every
subscription request allowing you to manipulate schema
dynamically.

If the schema is left undefined, you're trusted to
provide one in the returned `ExecutionArgs` from the
`onSubscribe` callback.

___

### subscribe

• `Optional` **subscribe**: (`args`: [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\>) => [`OperationResult`](../modules/handler.md#operationresult)

#### Type declaration

▸ (`args`): [`OperationResult`](../modules/handler.md#operationresult)

Is the `subscribe` function from GraphQL which is
used to execute the subscription operation.

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`OperationArgs`](../modules/handler.md#operationargs)<`Context`\> |

##### Returns

[`OperationResult`](../modules/handler.md#operationresult)

___

### validate

• `Optional` **validate**: (`schema`: `GraphQLSchema`, `documentAST`: `DocumentNode`, `rules?`: readonly `ValidationRule`[], `options?`: {}, `typeInfo?`: `TypeInfo`) => `ReadonlyArray`<`GraphQLError`\>

#### Type declaration

▸ (`schema`, `documentAST`, `rules?`, `options?`, `typeInfo?`): `ReadonlyArray`<`GraphQLError`\>

A custom GraphQL validate function allowing you to apply your
own validation rules.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `schema` | `GraphQLSchema` | - |
| `documentAST` | `DocumentNode` | - |
| `rules?` | readonly `ValidationRule`[] | - |
| `options?` | `Object` | - |
| `typeInfo?` | `TypeInfo` | **`Deprecated`** will be removed in 17.0.0 |

##### Returns

`ReadonlyArray`<`GraphQLError`\>
