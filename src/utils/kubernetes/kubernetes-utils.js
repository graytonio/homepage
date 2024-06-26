import { CoreV1Api, NetworkingV1Api } from "@kubernetes/client-node";

export async function parseIngressSelector(ingressName, namespace, kc, logger) {
  const coreApi = kc.makeApiClient(CoreV1Api);
  const networkApi = kc.makeApiClient(NetworkingV1Api);

  const ingress = await networkApi
    .readNamespacedIngress(ingressName, namespace)
    .then((response) => response.body)
    .catch((err) => {
      logger.error("Error getting ingress: %d %s %s", err.statusCode, err.body, err.response);
      return null;
    });

  if (!ingress) {
    return {"app.kubernetes.io/name": ingressName};
  }

  const serviceName = ingress.spec.rules[0].http.paths[0].backend.service.name;
  const svc = await coreApi
    .readNamespacedService(serviceName, namespace)
    .then((response) => response.body)
    .catch((err) => {
      logger.error("Error getting service: %d %s %s", err.statusCode, err.body, err.response);
      return null;
    });

  if (!svc) {
    return {"app.kubernetes.io/name": ingressName};
  }

  return svc.spec.selector;
}

export function parseCpu(cpuStr) {
  const unitLength = 1;
  const base = Number.parseInt(cpuStr, 10);
  const units = cpuStr.substring(cpuStr.length - unitLength);
  if (Number.isNaN(Number(units))) {
    switch (units) {
      case "n":
        return base / 1000000000;
      case "u":
        return base / 1000000;
      case "m":
        return base / 1000;
      default:
        return base;
    }
  } else {
    return Number.parseInt(cpuStr, 10);
  }
}

export function parseMemory(memStr) {
  const unitLength = memStr.substring(memStr.length - 1) === "i" ? 2 : 1;
  const base = Number.parseInt(memStr, 10);
  const units = memStr.substring(memStr.length - unitLength);
  if (Number.isNaN(Number(units))) {
    switch (units) {
      case "Ki":
        return base * 1000;
      case "K":
        return base * 1024;
      case "Mi":
        return base * 1000000;
      case "M":
        return base * 1024 * 1024;
      case "Gi":
        return base * 1000000000;
      case "G":
        return base * 1024 * 1024 * 1024;
      default:
        return base;
    }
  } else {
    return Number.parseInt(memStr, 10);
  }
}
