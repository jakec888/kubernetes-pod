const kubernetes = require('@kubernetes/client-node')
const { Component } = require('@serverless/core')

const defaults = {
  namespace: 'default'
}

class KubernetesPod extends Component {
  async deploy(inputs = {}) {
    const config = {
      ...defaults,
      ...inputs
    }

    const k8sCore = this.getKubernetesClient(kubernetes.CoreV1Api)

    let podExists = true
    try {
      await this.readPod(k8sCore, config)
    } catch (error) {
      podExists = error.response.body.code === 404 ? false : true
    }

    if (!podExists) {
      await this.createPod(k8sCore, config)
    }

    this.state = config
    return this.state
  }

  async read(inputs = {}) {
    const config = {
      ...defaults,
      ...inputs
    }

    const k8sCore = this.getKubernetesClient(kubernetes.CoreV1Api)

    const result = await this.readPod(k8sCore, config)
    return {
      metadata: {
        uid: result.body.metadata.uid,
        name: result.body.metadata.name,
        namespace: result.body.metadata.namespace
      },
      status: {
        phase: result.body.status.phase,
        podIP: result.body.status.podIP,
        hostIP: result.body.status.hostIP,
        startTime: result.body.status.startTime
      }
    }
  }

  async exec(inputs = {}) {
    const config = {
      ...defaults,
      ...inputs
    }

    const k8sExec = this.getKubernetesClient(kubernetes.Exec)

    return this.execPod(k8sExec, config)
  }

  async remove(inputs = {}) {
    const config = {
      ...defaults,
      ...inputs,
      ...this.state
    }

    const k8sCore = this.getKubernetesClient(kubernetes.CoreV1Api)

    await this.deletePod(k8sCore, config)

    this.state = {}
    return {}
  }

  // "private" methods
  getKubernetesClient(type) {
    const { endpoint, port } = this.credentials.kubernetes
    const token = this.credentials.kubernetes.serviceAccountToken
    const skipTLSVerify = this.credentials.kubernetes.skipTlsVerify == 'true'
    const kc = new kubernetes.KubeConfig()
    kc.loadFromOptions({
      clusters: [
        {
          name: 'cluster',
          skipTLSVerify,
          server: `${endpoint}:${port}`
        }
      ],
      users: [{ name: 'user', token }],
      contexts: [
        {
          name: 'context',
          user: 'user',
          cluster: 'cluster'
        }
      ],
      currentContext: 'context'
    })
    if (type.toString() === kubernetes.Exec.toString()) {
      return new type(kc)
    }
    return kc.makeApiClient(type)
  }

  async createPod(k8s, { name, namespace, spec }) {
    return k8s.createNamespacedPod(namespace, {
      metadata: { name },
      spec
    })
  }

  async readPod(k8s, { name, namespace }) {
    return k8s.readNamespacedPod(name, namespace)
  }

  async execPod(
    k8s,
    {
      namespace,
      name,
      container,
      command,
      stdin = process.stdin,
      stdout = process.stdout,
      stderr = process.stderr,
      tty = false
    }
  ) {
    return k8s.exec(namespace, name, container, command, stdout, stderr, stdin, tty)
  }

  async deletePod(k8s, { name, namespace }) {
    return k8s.deleteNamespacedPod(name, namespace)
  }
}

module.exports = KubernetesPod
