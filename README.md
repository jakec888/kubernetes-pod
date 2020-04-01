# kubernetes-pod

Instantly create, update and remove Kubernetes Pods with [Serverless Components](https://github.com/serverless/components).

&nbsp;

1. [Install](#1-install)
2. [Create](#2-create)
3. [Configure](#3-configure)
4. [Deploy](#4-deploy)

&nbsp;

### 1. Install

```console
$ npm install -g serverless
```

### 2. Create

Just create a `serverless.yml` file

```console
$ touch serverless.yml
```

Then create a `.env` file

```console
$ touch .env
```

Update the `.env` file with information about your Kubernetes setup

```
# .env
KUBERNETES_ENDPOINT=https://cluster.example.com
KUBERNETES_PORT=6443
KUBERNETES_SERVICE_ACCOUNT_TOKEN=xxxx
KUBERNETES_SKIP_TLS_VERIFY=false
```

### 3. Configure

```yml
# serverless.yml
org: acme
app: todo
name: todo-kubernetes-pod

component: kubernetes-pod@dev

inputs:
  namespace: 'default' # default is `'default'`
  name: my-pod
  spec:
    # ...
```

### 4. Deploy

```console
$ serverless
```

### New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
