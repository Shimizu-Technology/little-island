import ExpoModulesCore
import MultipeerConnectivity
import UIKit

// All state lives on the main queue, including delegate forwarding.
public final class IslandNearbyModule: Module {
  private var transport: FamilyTransport?
  public func definition() -> ModuleDefinition {
    Name("IslandNearby")
    Events("onNearby")
    AsyncFunction("identity") { () -> [String: String] in
      ["room": UUID().uuidString, "secret": UUID().uuidString + UUID().uuidString,
       "pin": String(format: "%06u", arc4random_uniform(1000000))]
    }.runOnQueue(.main)
    AsyncFunction("host") { (name: String, room: String, pin: String) in
      self.transport?.close()
      let t = try FamilyTransport(name: name, emit: { [weak self] event in self?.sendEvent("onNearby", event) })
      try t.host(room: room, pin: pin); self.transport = t
    }.runOnQueue(.main)
    AsyncFunction("browse") { (name: String) in
      self.transport?.close()
      let t = try FamilyTransport(name: name, emit: { [weak self] event in self?.sendEvent("onNearby", event) })
      t.browse(); self.transport = t
    }.runOnQueue(.main)
    AsyncFunction("join") { (peer: String, room: String, pin: String) in
      guard let t = self.transport else { throw FamilyError("Open nearby search first.") }
      try t.join(peer: peer, room: room, pin: pin)
    }.runOnQueue(.main)
    AsyncFunction("approve") { (peer: String, approved: Bool) in self.transport?.approve(peer: peer, approved: approved) }.runOnQueue(.main)
    AsyncFunction("send") { (peer: String, payload: String) in
      guard let t = self.transport else { throw FamilyError("The family room is closed.") }
      try t.send(peer: peer, payload: payload)
    }.runOnQueue(.main)
    AsyncFunction("close") { self.transport?.close(); self.transport = nil }.runOnQueue(.main)
    OnDestroy { self.transport?.close(); self.transport = nil }
  }
}
private struct FamilyError: LocalizedError {
  let message: String
  init(_ message: String) { self.message = message }
  var errorDescription: String? { message }
}
private final class FamilyTransport: NSObject, MCSessionDelegate, MCNearbyServiceAdvertiserDelegate, MCNearbyServiceBrowserDelegate {
  private let service = "li-mystery"
  private let me: MCPeerID
  private var session: MCSession!
  private var advertiser: MCNearbyServiceAdvertiser?
  private var browser: MCNearbyServiceBrowser?
  private var peers: [String: MCPeerID] = [:]
  private var rooms: [String: String] = [:]
  private var invitations: [String: (Bool, MCSession?) -> Void] = [:]
  private var invitationTokens: [String: UUID] = [:]
  private var joinAttempt = UUID()
  private var hosting = false
  private var room = "", pin = ""
  private var hostPeer: MCPeerID?
  private var closed = false
  private var attemptTimes: [Date] = []
  private let emit: ([String: Any]) -> Void
  init(name: String, emit: @escaping ([String: Any]) -> Void) throws {
    guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, name.count <= 20, name.utf8.count <= 63,
      name.unicodeScalars.allSatisfy({ !CharacterSet.controlCharacters.contains($0) }) else { throw FamilyError("Choose a short name without control characters (at most 63 UTF-8 bytes).") }
    self.me = MCPeerID(displayName: name); self.emit = emit
    super.init()
    session = MCSession(peer: me, securityIdentity: nil, encryptionPreference: .required)
    session.delegate = self
    NotificationCenter.default.addObserver(self, selector: #selector(background), name: UIApplication.didEnterBackgroundNotification, object: nil)
  }
  private func handle(_ peer: MCPeerID) -> String {
    if let found = peers.first(where: { $0.value == peer }) { return found.key }
    let id = UUID().uuidString; peers[id] = peer; return id
  }
  private func publish(_ event: [String: Any]) { if !closed { emit(event) } }
  func host(room: String, pin: String) throws {
    guard UUID(uuidString: room) != nil, validPin(pin) else { throw FamilyError("Invalid private room details.") }
    hosting = true; self.room = room; self.pin = pin
    advertiser = MCNearbyServiceAdvertiser(peer: me, discoveryInfo: ["room": room, "v": "1"], serviceType: service)
    advertiser?.delegate = self; advertiser?.startAdvertisingPeer()
    publish(["type": "status", "status": "hosting", "message": "Family room open. Share the PIN privately."])
  }
  func browse() {
    browser = MCNearbyServiceBrowser(peer: me, serviceType: service); browser?.delegate = self; browser?.startBrowsingForPeers()
    publish(["type": "status", "status": "browsing", "message": "Looking for family rooms. Allow Local Network access if asked."])
  }
  private func validPin(_ value: String) -> Bool { value.utf8.count == 6 && value.utf8.allSatisfy { $0 >= 48 && $0 <= 57 } }
  private func matchesPin(_ other: String) -> Bool {
    guard validPin(other) else { return false }; var difference: UInt8 = 0
    for (a, b) in zip(pin.utf8, other.utf8) { difference |= a ^ b }; return difference == 0
  }
  func join(peer: String, room: String, pin: String) throws {
    guard !hosting, session.connectedPeers.isEmpty, hostPeer == nil, let target = peers[peer], rooms[peer] == room, validPin(pin) else { throw FamilyError("Choose a discovered family room and its six-digit PIN.") }
    let data = try JSONSerialization.data(withJSONObject: ["v": 1, "room": room, "pin": pin])
    let attempt = UUID(); joinAttempt = attempt
    self.room = room; hostPeer = target
    browser?.invitePeer(target, to: session, withContext: data, timeout: 25)
    publish(["type": "status", "status": "waiting", "message": "Waiting for the parent to approve this device."])
    DispatchQueue.main.asyncAfter(deadline: .now() + 28) { [weak self] in
      guard let self, !self.closed, self.joinAttempt == attempt, self.hostPeer == target, !self.session.connectedPeers.contains(target) else { return }
      self.hostPeer = nil; self.publish(["type": "status", "status": "join-failed", "message": "Join was not accepted. Check the PIN, parent approval and Local Network permission, then try again."])
    }
  }
  func approve(peer: String, approved: Bool) {
    guard let handler = invitations.removeValue(forKey: peer) else { return }; invitationTokens.removeValue(forKey: peer)
    handler(approved && session.connectedPeers.count < 7, approved ? session : nil)
  }
  func send(peer: String, payload: String) throws {
    guard !closed, let target = peers[peer], session.connectedPeers.contains(target), payload.utf8.count <= 16384 else { throw FamilyError("Player disconnected or message too large.") }
    if !hosting && target != hostPeer { throw FamilyError("Only the parent host receives client messages.") }
    guard let data = payload.data(using: .utf8) else { throw FamilyError("Invalid message.") }
    try session.send(data, toPeers: [target], with: .reliable)
  }
  @objc private func background() { publish(["type": "status", "status": "background", "message": hosting ? "Host paused the app. This room has closed; create a new room." : "Disconnected while paused. Rejoin the same room with parent approval."]); close() }
  func close() {
    guard !closed else { return }; closed = true
    advertiser?.stopAdvertisingPeer(); browser?.stopBrowsingForPeers()
    invitations.values.forEach { $0(false, nil) }; invitations.removeAll(); invitationTokens.removeAll(); joinAttempt = UUID()
    session?.disconnect(); session?.delegate = nil; advertiser?.delegate = nil; browser?.delegate = nil
    NotificationCenter.default.removeObserver(self)
  }
  func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didNotStartAdvertisingPeer error: Error) {
    DispatchQueue.main.async { self.publish(["type": "status", "status": "error", "message": "Nearby access failed. Allow Local Network in Settings and check Wi-Fi/Bluetooth. \(error.localizedDescription)"]) }
  }
  func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
    DispatchQueue.main.async {
      self.attemptTimes = self.attemptTimes.filter { Date().timeIntervalSince($0) < 60 }
      guard !self.closed, self.hosting, self.attemptTimes.count < 12 else { invitationHandler(false, nil); return }
      self.attemptTimes.append(Date())
      guard self.session.connectedPeers.count + self.invitations.count < 7, let context, context.count <= 256,
        let data = try? JSONSerialization.jsonObject(with: context) as? [String: Any], data["v"] as? Int == 1,
        data["room"] as? String == self.room, let supplied = data["pin"] as? String, self.matchesPin(supplied) else { invitationHandler(false, nil); return }
      let id = self.handle(peerID)
      guard self.invitations[id] == nil else { invitationHandler(false, nil); return }
      let invitation = UUID()
      self.invitations[id] = invitationHandler; self.invitationTokens[id] = invitation
      self.publish(["type": "invitation", "peer": id, "name": String(peerID.displayName.prefix(20))])
      DispatchQueue.main.asyncAfter(deadline: .now() + 22) { [weak self] in
        guard let self, self.invitationTokens[id] == invitation else { return }
        self.approve(peer: id, approved: false)
      }
    }
  }
  func browser(_ browser: MCNearbyServiceBrowser, didNotStartBrowsingForPeers error: Error) {
    DispatchQueue.main.async { self.publish(["type": "status", "status": "error", "message": "Nearby discovery failed. Allow Local Network in Settings and check Wi-Fi/Bluetooth. \(error.localizedDescription)"]) }
  }
  func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
    DispatchQueue.main.async { guard !self.closed, info?["v"] == "1", let room = info?["room"], UUID(uuidString: room) != nil else { return }; let id = self.handle(peerID); self.rooms[id] = room; self.publish(["type": "found", "peer": id, "room": room, "name": String(peerID.displayName.prefix(20))]) }
  }
  func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
    DispatchQueue.main.async { let id = self.handle(peerID); self.rooms.removeValue(forKey: id); self.publish(["type": "lost", "peer": id]) }
  }
  func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
    DispatchQueue.main.async {
      guard !self.closed else { return }; let id = self.handle(peerID)
      if state == .connected { guard self.hosting || peerID == self.hostPeer else { return }; self.browser?.stopBrowsingForPeers(); self.publish(["type": "connected", "peer": id]) }
      else if state == .notConnected { guard self.hosting || peerID == self.hostPeer else { return }; self.publish(["type": "disconnected", "peer": id]); if !self.hosting { self.hostPeer = nil } }
    }
  }
  func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
    guard data.count <= 16384, let payload = String(data: data, encoding: .utf8) else { return }
    DispatchQueue.main.async { guard !self.closed, self.session.connectedPeers.contains(peerID), self.hosting || peerID == self.hostPeer else { return }; self.publish(["type": "data", "peer": self.handle(peerID), "payload": payload]) }
  }
  func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) { stream.close() }
  func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) { progress.cancel() }
  func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}
