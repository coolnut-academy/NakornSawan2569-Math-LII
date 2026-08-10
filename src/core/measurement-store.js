function clonePoints(points = []) {
  return points.map(([x, y]) => [x, y]);
}

function cloneMeasurement(measurement) {
  if (!measurement) return null;
  return {
    source: measurement.source,
    targetWidth: measurement.targetWidth,
    targetHeight: measurement.targetHeight,
    corners: clonePoints(measurement.corners),
    imagePoints: clonePoints(measurement.imagePoints),
    referencePoints: measurement.referencePoints ? clonePoints(measurement.referencePoints) : null,
    result: {
      ...measurement.result,
      matrix: measurement.result.matrix.map((row) => [...row]),
      inverse: measurement.result.inverse.map((row) => [...row]),
      recoveredPoints: clonePoints(measurement.result.recoveredPoints)
    }
  };
}

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredMeasurement(storageKey) {
  const storage = getBrowserStorage();
  if (!storageKey || !storage) return null;
  try {
    return cloneMeasurement(JSON.parse(storage.getItem(storageKey)));
  } catch {
    try {
      storage.removeItem(storageKey);
    } catch {
      // Storage can be blocked by the browser; the in-memory store still works.
    }
    return null;
  }
}

export function createMeasurementStore({ source, label, storageKey = null } = {}) {
  let confirmedMeasurement = readStoredMeasurement(storageKey);
  const listeners = new Set();

  return {
    source,
    label,
    publish(measurement) {
      confirmedMeasurement = cloneMeasurement({ ...measurement, source });
      const storage = getBrowserStorage();
      if (storageKey && storage) {
        try {
          storage.setItem(storageKey, JSON.stringify(confirmedMeasurement));
        } catch {
          // Keep the current session working when persistent storage is unavailable.
        }
      }
      listeners.forEach((listener) => listener(cloneMeasurement(confirmedMeasurement)));
    },
    subscribe(listener) {
      listeners.add(listener);
      if (confirmedMeasurement) listener(cloneMeasurement(confirmedMeasurement));
      return () => listeners.delete(listener);
    },
    get() {
      return cloneMeasurement(confirmedMeasurement);
    }
  };
}

export const presetMeasurementStore = createMeasurementStore({
  source: 'preset',
  label: 'Preset',
  storageKey: 'lii:measurement:preset'
});

export const liveMeasurementStore = createMeasurementStore({
  source: 'live',
  label: 'Live Studio',
  storageKey: 'lii:measurement:live'
});
