import UIKit
import WebKit

private final class WeakScriptHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}

final class GameViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private var game: WKWebView!
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { [.portrait, .landscapeLeft, .landscapeRight] }
    override var shouldAutorotate: Bool { true }

    override func viewDidLoad() {
        super.viewDidLoad()
        let background = UIColor(red: 6/255, green: 12/255, blue: 23/255, alpha: 1)
        view.backgroundColor = background
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.userContentController.add(WeakScriptHandler(self), name: "shareText")
        game = WKWebView(frame: .zero, configuration: config)
        game.translatesAutoresizingMaskIntoConstraints = false
        game.backgroundColor = background
        game.isOpaque = false
        game.navigationDelegate = self
        game.scrollView.bounces = false
        game.scrollView.contentInsetAdjustmentBehavior = .never
        view.addSubview(game)
        NSLayoutConstraint.activate([
            game.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            game.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            game.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            game.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor)
        ])
        guard let directory = Bundle.main.url(forResource: "www", withExtension: nil) else { return }
        game.loadFileURL(directory.appendingPathComponent("index.html"), allowingReadAccessTo: directory)
    }
    func pauseForBackground() {
        game?.evaluateJavaScript("window.dispatchEvent(new Event('blur'))", completionHandler: nil)
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let directory = Bundle.main.url(forResource: "www", withExtension: nil) else { decisionHandler(.cancel); return }
        decisionHandler(url.isFileURL && url.path.hasPrefix(directory.path + "/") ? .allow : .cancel)
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "shareText", let data = message.body as? [String: String], let text = data["text"] else { return }
        let sheet = UIActivityViewController(activityItems: [text], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = view
        sheet.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
        present(sheet, animated: true)
    }
}
