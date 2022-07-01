[graphql-sse](../README.md) / HandlerOptions

# Interface: HandlerOptions<Request, Response\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Request` | extends `IncomingMessage` = `IncomingMessage` |
| `Response` | extends `ServerResponse` = `ServerResponse` |

## Table of contents

### Properties

- [context](HandlerOptions.md#context)
- [schema](HandlerOptions.md#schema)
- [validate](HandlerOptions.md#validate)

### Methods

- [authenticate](HandlerOptions.md#authenticate)
- [execute](HandlerOptions.md#execute)
- [onComplete](HandlerOptions.md#oncomplete)
- [onConnected](HandlerOptions.md#onconnected)
- [onConnecting](HandlerOptions.md#onconnecting)
- [onDisconnect](HandlerOptions.md#ondisconnect)
- [onNext](HandlerOptions.md#onnext)
- [onOperation](HandlerOptions.md#onoperation)
- [onSubscribe](HandlerOptions.md#onsubscribe)
- [subscribe](HandlerOptions.md#subscribe)

## Properties

### context

• `Optional` **context**: [`ExecutionContext`](../README.md#executioncontext) \| (`req`: `Request`, `args`: `ExecutionArgs`) => [`ExecutionContext`](../README.md#executioncontext) \| `Promise`<[`ExecutionContext`](../README.md#executioncontext)\>

A value which is provided to every resolver and holds
important contextual information like the currently
logged in user, or access to a database.

Note that the context function is invoked on each operation only once.
Meaning, for subscriptions, only at the point of initialising the subscription;
not on every subscription event emission. Read more about the context lifecycle
in subscriptions here: https://github.com/graphql/graphql-js/issues/894.

___

### schema

• `Optional` **schema**: `GraphQLSchema` \| (`req`: `Request`, `args`: `Omit`<`ExecutionArgs`, ``"schema"``\>) => `GraphQLSchema` \| `Promise`<`GraphQLSchema`\>

The GraphQL schema on which the operations will
be executed and validated against.

If a function is provided, it will be called on every
subscription request allowing you to manipulate schema
dynamically.

If the schema is left undefined, you're trusted to
provide one in the returned `ExecutionArgs` from the
`onSubscribe` callback.

___

### validate

• `Optional` **validate**: (`schema`: `GraphQLSchema`, `documentAST`: `DocumentNode`, `rules?`: readonly `ValidationRule`[], `options?`: {}, `typeInfo?`: `TypeInfo`) => `ReadonlyArray`<`GraphQLError`\>

#### Type declaration

▸ (`schema`, `documentAST`, `rules?`, `options?`, `typeInfo?`): `ReadonlyArray`<`GraphQLError`\>

Implements the "Validation" section of the spec.

Validation runs synchronously, returning an array of encountered errors, or
an empty array if no errors were encountered and the document is valid.

A list of specific validation rules may be provided. If not provided, the
default list of rules defined by the GraphQL specification will be used.

Each validation rules is a function which returns a visitor
(see the language/visitor API). Visitor methods are expected to return
GraphQLErrors, or Arrays of GraphQLErrors when invalid.

Validate will stop validation after a `maxErrors` limit has been reached.
Attackers can send pathologically invalid queries to induce a DoS attack,
so by default `maxErrors` set to 100 errors.

Optionally a custom TypeInfo instance may be provided. If not provided, one
will be created from the provided schema.

##### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `GraphQLSchema` |
| `documentAST` | `DocumentNode` |
| `rules?` | readonly `ValidationRule`[] |
| `options?` | `Object` |
| `typeInfo?` | `TypeInfo` |

##### Returns

`ReadonlyArray`<`GraphQLError`\>

## Methods

### authenticate

▸ `Optional` **authenticate**(`req`, `res`): `undefined` \| `string` \| `void` \| `Promise`<`undefined` \| `string` \| `void`\>

Authenticate the client. Returning a string indicates that the client
is authenticated and the request is ready to be processed.

A token of type string MUST be supplied; if there is no token, you may
return an empty string (`''`);

If you want to respond to the client with a custom status or body,
you should do so using the provided `res` argument which will stop
further execution.

**`Default`**

 'req.headers["x-graphql-event-stream-token"] || req.url.searchParams["token"] || generateRandomUUID()' // https://gist.github.com/jed/982883

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |
| `res` | `Response` |

#### Returns

`undefined` \| `string` \| `void` \| `Promise`<`undefined` \| `string` \| `void`\>

___

### execute

▸ `Optional` **execute**(`args`): [`OperationResult`](../README.md#operationresult)

Is the `execute` function from GraphQL which is
used to execute the query and mutation operations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `ExecutionArgs` |

#### Returns

[`OperationResult`](../README.md#operationresult)

___

### onComplete

▸ `Optional` **onComplete**(`req`, `args`): `void` \| `Promise`<`void`\>

The complete callback is executed after the operation
has completed and the client has been notified.

Since the library makes sure to complete streaming
operations even after an abrupt closure, this callback
will always be called.

First argument, the request, is always the GraphQL operation
request.

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |
| `args` | `ExecutionArgs` |

#### Returns

`void` \| `Promise`<`void`\>

___

### onConnected

▸ `Optional` **onConnected**(`req`): `void` \| `Promise`<`void`\>

Called when a new event stream has been succesfully connected and
accepted, and after all pending messages have been flushed.

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |

#### Returns

`void` \| `Promise`<`void`\>

___

### onConnecting

▸ `Optional` **onConnecting**(`req`, `res`): `void` \| `Promise`<`void`\>

Called when a new event stream is connecting BEFORE it is accepted.
By accepted, its meant the server responded with a 200 (OK), alongside
flushing the necessary event stream headers.

If you want to respond to the client with a custom status or body,
you should do so using the provided `res` argument which will stop
further execution.

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |
| `res` | `Response` |

#### Returns

`void` \| `Promise`<`void`\>

___

### onDisconnect

▸ `Optional` **onDisconnect**(`req`): `void` \| `Promise`<`void`\>

Called when an event stream has disconnected right before the
accepting the stream.

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |

#### Returns

`void` \| `Promise`<`void`\>

___

### onNext

▸ `Optional` **onNext**(`req`, `args`, `result`): `void` \| [`ExecutionResult`](ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\> \| `Promise`<`void` \| [`ExecutionResult`](ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\>\>

Executed after an operation has emitted a result right before
that result has been sent to the client.

Results from both single value and streaming operations will
invoke this callback.

Use this callback if you want to format the execution result
before it reaches the client.

First argument, the request, is always the GraphQL operation
request.

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |
| `args` | `ExecutionArgs` |
| `result` | [`ExecutionResult`](ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\> |

#### Returns

`void` \| [`ExecutionResult`](ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\> \| `Promise`<`void` \| [`ExecutionResult`](ExecutionResult.md)<`Record`<`string`, `unknown`\>, `Record`<`string`, `unknown`\>\> \| [`ExecutionPatchResult`](ExecutionPatchResult.md)<`unknown`, `Record`<`string`, `unknown`\>\>\>

___

### onOperation

▸ `Optional` **onOperation**(`req`, `res`, `args`, `result`): `void` \| [`OperationResult`](../README.md#operationresult) \| `Promise`<`void` \| [`OperationResult`](../README.md#operationresult)\>

Executed after the operation call resolves. For streaming
operations, triggering this callback does not necessarely
mean that there is already a result available - it means
that the subscription process for the stream has resolved
and that the client is now subscribed.

The `OperationResult` argument is the result of operation
execution. It can be an iterator or already a value.

Use this callback to listen for GraphQL operations and
execution result manipulation.

If you want to respond to the client with a custom status or body,
you should do so using the provided `res` argument which will stop
further execution.

First argument, the request, is always the GraphQL operation
request.

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |
| `res` | `Response` |
| `args` | `ExecutionArgs` |
| `result` | [`OperationResult`](../README.md#operationresult) |

#### Returns

`void` \| [`OperationResult`](../README.md#operationresult) \| `Promise`<`void` \| [`OperationResult`](../README.md#operationresult)\>

___

### onSubscribe

▸ `Optional` **onSubscribe**(`req`, `res`, `params`): `void` \| `ExecutionArgs` \| `Promise`<`void` \| `ExecutionArgs`\>

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

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |
| `res` | `Response` |
| `params` | [`RequestParams`](RequestParams.md) |

#### Returns

`void` \| `ExecutionArgs` \| `Promise`<`void` \| `ExecutionArgs`\>

___

### subscribe

▸ `Optional` **subscribe**(`args`): [`OperationResult`](../README.md#operationresult)

Is the `subscribe` function from GraphQL which is
used to execute the subscription operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `ExecutionArgs` |

#### Returns

[`OperationResult`](../README.md#operationresult)
