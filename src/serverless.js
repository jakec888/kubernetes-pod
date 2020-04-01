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
    const skipTLSVerify = this.credentials.kubernetes.skipTlsVerify ? true : false
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

  async deletePod(k8s, { name, namespace }) {
    return k8s.deleteNamespacedPod(name, namespace)
  }
}

module.exports = KubernetesPod
