import Foundation
import UIKit

/// Monitors system stability for long-duration recording
/// Handles thermal state, memory pressure, and disk space
protocol TimelapseStabilityManagerDelegate: AnyObject {
    func stabilityManager(_ manager: TimelapseStabilityManager, didEncounterWarning warning: TimelapseStabilityManager.Warning)
    func stabilityManager(_ manager: TimelapseStabilityManager, shouldStopDueToError error: Error)
}

class TimelapseStabilityManager {
    
    // MARK: - Types
    
    enum Warning {
        case lowMemory
        case thermalCritical
        case diskSpaceLow
    }
    
    struct StabilityError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }
    
    // MARK: - Properties
    
    weak var delegate: TimelapseStabilityManagerDelegate?
    
    private var isMonitoring = false
    private var diskSpaceTimer: Timer?
    
    // Thresholds
    private let minimumDiskSpaceMB: Double = 500  // 500MB minimum
    private let diskCheckIntervalSeconds: TimeInterval = 30
    
    // MARK: - Initialization
    
    init() {}
    
    // MARK: - Monitoring
    
    func startMonitoring() {
        guard !isMonitoring else { return }
        isMonitoring = true
        
        // Register for memory warnings
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
        
        // Register for thermal state changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleThermalStateChange),
            name: ProcessInfo.thermalStateDidChangeNotification,
            object: nil
        )
        
        // Start disk space monitoring timer
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.diskSpaceTimer = Timer.scheduledTimer(withTimeInterval: self.diskCheckIntervalSeconds, repeats: true) { [weak self] _ in
                self?.checkDiskSpace()
            }
        }
        
        // Initial checks
        checkThermalState()
        checkDiskSpace()
    }
    
    func stopMonitoring() {
        isMonitoring = false
        
        NotificationCenter.default.removeObserver(self)
        
        diskSpaceTimer?.invalidate()
        diskSpaceTimer = nil
    }
    
    // MARK: - Memory Warning
    
    @objc private func handleMemoryWarning() {
        guard isMonitoring else { return }
        
        print("[StabilityManager] Memory warning received")
        delegate?.stabilityManager(self, didEncounterWarning: .lowMemory)
    }
    
    // MARK: - Thermal State
    
    @objc private func handleThermalStateChange() {
        checkThermalState()
    }
    
    private func checkThermalState() {
        guard isMonitoring else { return }
        
        let thermalState = ProcessInfo.processInfo.thermalState
        
        switch thermalState {
        case .nominal, .fair:
            // All good
            break
            
        case .serious:
            print("[StabilityManager] Thermal state: SERIOUS")
            delegate?.stabilityManager(self, didEncounterWarning: .thermalCritical)
            
        case .critical:
            print("[StabilityManager] Thermal state: CRITICAL")
            delegate?.stabilityManager(self, didEncounterWarning: .thermalCritical)
            // Don't force stop - let the engine decide based on the warning
            
        @unknown default:
            break
        }
    }
    
    // MARK: - Disk Space
    
    private func checkDiskSpace() {
        guard isMonitoring else { return }
        
        let availableSpaceMB = getAvailableDiskSpaceMB()
        
        if availableSpaceMB < minimumDiskSpaceMB {
            print("[StabilityManager] Low disk space: \(availableSpaceMB)MB available")
            delegate?.stabilityManager(self, didEncounterWarning: .diskSpaceLow)
            
            if availableSpaceMB < 100 {  // Critical: less than 100MB
                delegate?.stabilityManager(
                    self,
                    shouldStopDueToError: StabilityError(message: "Disk space critically low")
                )
            }
        }
    }
    
    private func getAvailableDiskSpaceMB() -> Double {
        let fileManager = FileManager.default
        
        do {
            let attributes = try fileManager.attributesOfFileSystem(forPath: NSHomeDirectory())
            if let freeSpace = attributes[.systemFreeSize] as? Int64 {
                return Double(freeSpace) / (1024 * 1024)  // Convert to MB
            }
        } catch {
            print("[StabilityManager] Failed to get disk space: \(error)")
        }
        
        return Double.greatestFiniteMagnitude  // Assume plenty of space if we can't check
    }
    
    // MARK: - Cleanup
    
    deinit {
        stopMonitoring()
    }
}
