import * as vscode from 'vscode';

export function createStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = '$(git-pull-request) Laplace';
  item.tooltip = 'Click to generate PR description';
  item.command = 'laplace.generateDescription';
  item.show();
  return item;
}
