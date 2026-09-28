import React
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene, willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate
    else { return }

    let rootView = appDelegate.rootViewFactory().view(
      withModuleName: appDelegate.moduleName ?? "",
      initialProperties: appDelegate.initialProps,
      launchOptions: nil)

    let window = UIWindow(windowScene: windowScene)
    let rootViewController = appDelegate.createRootViewController()
    appDelegate.setRootView(rootView, toRootViewController: rootViewController)
    window.rootViewController = rootViewController

    self.window = window
    appDelegate.window = window
    window.makeKeyAndVisible()
  }
}
