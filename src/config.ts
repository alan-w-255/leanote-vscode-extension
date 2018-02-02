import * as vscode from 'vscode'


export let leanoteConfig = {
    LEANOTE_HOST: '120.79.11.117',
    TOKEN: '',
    TITLE_START_POS: new vscode.Position(1, 0),
    TITLE_END_POS: new vscode.Position(1, 6),
    TAGS_START_POS: new vscode.Position(2, 0),
    TAGS_END_POS: new vscode.Position(2, 5),
    NOTEBOOK_START_POS: new vscode.Position(3, 0),
    NOTEBOOK_END_POS: new vscode.Position(3, 9),
    NOTE_META_DATA: `---\ntitle: \ntags: \nnotebook: \n---\n`,
    maxSyncEntry: 100
}