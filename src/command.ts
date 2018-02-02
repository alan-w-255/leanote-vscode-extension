/**
 * 在vs code 编辑 leanote 笔记的命令
 */
import * as vscode from 'vscode'
import { Leanote, Type as LeanoteType } from './leanote'
import { TextEdit, Selection } from 'vscode';
import { leanoteConfig } from './config'
import { normalize } from 'path';
import { activate } from './extension';

const LeanoteServer = new Leanote(leanoteConfig.LEANOTE_HOST)

export function login() {
    vscode.window.showInputBox({
        prompt: 'input your leanote server, default is "leanote.com"',
        placeHolder: 'leanote.com',
    })
    .then(value => {
        leanoteConfig.LEANOTE_HOST = value
    })
    vscode.window.showInputBox({
        prompt: 'please input your email for signing in ' + leanoteConfig.LEANOTE_HOST,
        validateInput: (value): Promise<string> => {
            return new Promise<string>((resolve, reject) => {
                const reg = /^\w+@\w+\.\w+/
                if (reg.test(value) === true) {
                    resolve(null)
                } else {
                    reject('incorrect email format')
                }
            })
        }
    })
    .then(email => {
        vscode.window.showInputBox({
            prompt: 'please input your password for leanote',
            password: true,
        })
        .then(pwd => {
            LeanoteServer.login(email, pwd).then(token => {
                leanoteConfig.TOKEN = token
            })
        })
    })
}


export function createNewLocalNote() {
    vscode.workspace.openTextDocument({
        language: 'markdown',
        content: leanoteConfig.NOTE_META_DATA
    })
    .then(TextDoc => {
        vscode.window.showTextDocument(TextDoc)
        .then(TextEditor => {
            TextEditor.selection = new vscode.Selection(leanoteConfig.TITLE_END_POS, leanoteConfig.TITLE_END_POS)
        })
    }, reason => {
        vscode.window.showErrorMessage('unable to open text document: ' + reason)
        throw 'unable to open text document: ' + reason
    })
}

export function addNewNoteToLeanoteServer () {
    const activeTextEditor = vscode.window.activeTextEditor
    const currentDocument = activeTextEditor.document
    const userInputTitle = currentDocument.lineAt(leanoteConfig.TITLE_START_POS).text
                            .split(':')[1].trim()
    const userInputTags: string[] = currentDocument.lineAt(leanoteConfig.TAGS_START_POS).text
                                    .split(':')[1].split(',').map<string>((k):string => {return k.trim()})
    const userInputNotebook = currentDocument.lineAt(leanoteConfig.NOTEBOOK_START_POS).text
                                .split(':')[1].trim()
    const userInputContent = currentDocument.getText(
        new vscode.Range(
            leanoteConfig.NOTEBOOK_START_POS.line + 1, 
            0, 
            currentDocument.lineCount, 
            currentDocument.lineAt(currentDocument.lineCount).text.length )
    )

    if (userInputTitle === '') {
        vscode.window.showErrorMessage('title can\'t be empty')
        return
    }
    if (userInputNotebook === '') {
        vscode.window.showErrorMessage('notebook can\'t be empty')
        return
    }
    const LeanoteServer = new Leanote(leanoteConfig.LEANOTE_HOST)
    LeanoteServer.getNotebooks()
    .then(notebooksOnServer => {
        const targetNotebook = notebooksOnServer.find((nb): boolean => {
            return nb.title === userInputNotebook
        })
        let notebookId: string
        if (targetNotebook === undefined) {
            LeanoteServer.addNotebook(userInputNotebook, 1)
            .then(newNotebook => {
                notebookId = newNotebook.NotebookId
            })
        }

        const newNote: LeanoteType.Note = {
            Title: userInputTitle,
            NotebookId: notebookId,
            Tags: userInputTags,
            Content: userInputContent,
            IsBlog: false,
            IsMarkdown: true,
            IsTrash: false
        }

        LeanoteServer.addMarkdownNote(newNote)
    })
}

export function openNoteFromLeanoteServer() {

}

export function updatedNoteToLeanoteServer() {

}