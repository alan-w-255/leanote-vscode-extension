/**
 * 对leanote的api进行封装
 */

import * as http from "http"
import * as assert from 'assert'
import * as vscode from 'vscode'

const LEANOTE_HOST = '120.79.11.117'
const TITLE_START_POS = new vscode.Position(1, 0)
const TITLE_END_POS = new vscode.Position(1, 6)
const TAGS_START_POS = new vscode.Position(2, 0)
const TAGS_END_POS = new vscode.Position(2, 5)
const NOTEBOOK_START_POS = new vscode.Position(3, 0)
const NOTEBOOK_END_POS = new vscode.Position(3, 9)
const NOTE_META_DATA = `---
title: 
tags: 
notebook: 
---
`
const maxSyncEntry = 100

export namespace Type {

    export interface Time{
        time: string
    }

    export interface User {
        readonly UserId: string
        Username?: string
        Email: string
        Verified: boolean
        Logo?: string
    }

    export interface Notebook {
        readonly NotebookId: string
        readonly UserId: string
        title: string
        ParentNotebookId: string
        Seq: number
        IsBlog: boolean
        IsDeleted: boolean
        CreateTime: Time
        UpdatedTime: Time
        Usn: number // update sequence number
    }

    export interface Note {
        readonly NoteId?: string
        NotebookId?: string
        readonly UserId?: string
        Title: string
        Tags?: string[]
        Content?: string
        IsMarkdown: boolean
        IsBlog: boolean
        IsTrash: boolean
        Files?: NoteFile[]
        CreatedTime?: Time
        UpdateTime?: Time
        PublicTime?: Time
        Usn?: number
    }

    export interface NoteFile {

    }

    export interface NoteContent {
        readonly NoteId: string
        UserId: string
        Content: string
    }

    export interface Tag {
        readonly TagId: string
        readonly UserId: string
        Tag: string
        CreatedTime: Time
        UpdateTime: Time
        IsDeleted: boolean
        Usn: number
    }

    export interface UpdateRe {
        Ok: boolean
        Msg: string
        Usn: number
    }
}

export class Leanote {
    private serverHostName: string
    private token: string
    private maxSyncEntry: number = maxSyncEntry
    constructor(serverHostName: string){
        this.serverHostName = serverHostName
    }

    private JSONToUrlParams(json: any): string {
        return Object.keys(json).map((value) => {
            return `${value}=${json[value]}`
        }).join("&")
    }

    public login(user: string, pwd: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = http.request({
                protocol: 'http',
                method: 'GET',
                path: `/api/auth/login?${this.JSONToUrlParams({
                    email: user,
                    pwd: pwd
                })}`,
                hostname: LEANOTE_HOST
            }, (res) => {
                res.setEncoding('utf8')
                res.on('data', (data) => {
                    const dataJson = JSON.parse(<string>data)
                    if(dataJson['Ok'] === true){
                        this.token = JSON.parse(<string>data)
                        resolve(this.token)
                    }else {
                        reject(`login failed: ${dataJson['Msg']} `)
                    }
                })
            })
            req.end()
        })
    }

    public logout(): Promise<string>{
        return new Promise((resolve, reject) => {
            const req = http.request({
                protocol: 'http',
                method: 'GET',
                hostname: LEANOTE_HOST,
                path: `/api/auth/logout?${this.JSONToUrlParams(this.token)}`
            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if(JsonData['Ok'] === true) {
                        resolve(JsonData['Msg'])
                    } else {
                        reject(JsonData['Msg'])
                    }
                })
            })
            req.end()
        })
    }

    public getNotebooks(): Promise<Type.Notebook[]> {
        return new Promise<Type.Notebook[]>((resolve, reject) => {
            const req = http.request({
                protocol: 'http',
                hostname: LEANOTE_HOST,
                path: `/api/notebook/getNotebooks${this.JSONToUrlParams(this.token)}`,
                method: 'GET'
            }, res =>{
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if('Ok' in JsonData){
                        reject(JsonData['Msg'])
                    }else{
                        resolve(JSON.parse(<string>data))
                    }
                })
            })
            req.end()
        })
    }

    public addNotebook(title: string, seq: number, ParentNotebookId?: string): Promise<Type.Notebook>{
        return new Promise<Type.Notebook>((resolve, reject) => {
            let params = {
                title,
                seq,
                token: this.token
            }
            if(ParentNotebookId === undefined) {
                params['ParentNotebookId'] = ParentNotebookId
            }
            const req = http.request({
                protocol: 'http',
                method: 'POST',
                hostname: LEANOTE_HOST,
                path: `/api/notebook/addNotebook?${params} `
            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if ('Ok' in JsonData) {
                        reject(JsonData['Msg'])
                    } else {
                        resolve(JsonData)
                    }
                })
            })
        })
    }

    public updateNotebook(notebookId: string, title: string, ParentNotebookId: string, seq: number, usn: number): Promise<Type.Notebook>{
        return new Promise<Type.Notebook>((resolve, reject) => {
            let params = {
                notebookId,
                title,
                token: this.token
            }
            if (ParentNotebookId !== undefined) {
                params['ParentNotebookId'] = ParentNotebookId
            }
            let option = {
                protocol: 'http',
                method: 'post',
                hostname: LEANOTE_HOST,
                path: `/api/notebook/updateNotebook?${this.JSONToUrlParams(params)}`
            }
            const req = http.request(option, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if ('Ok' in JsonData) {
                        reject(JsonData['Msg'])
                    } else {
                        resolve(JsonData)
                    }
                })
            })
            req.end()
        })
    }

    public deleteNotebook(notebookId: string, usn: number): Promise<string>{
        return new Promise<string>((resole, reject) => {
            const req = http.request({
                protocol: 'http',
                method: 'POST',
                hostname: LEANOTE_HOST,
                path: `/api/notebook/deleteNotebook?${
                    this.JSONToUrlParams({
                        notebookId,
                        usn
                    })
                }`

            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if(JsonData['Ok'] === true) {
                        resole()
                    } else {
                        reject(JsonData['Msg'])
                    }
                })
            })
            req.end()
        })
    }

    public getSyncNotes(afterUsn: number, maxEntry=maxSyncEntry): Promise<Type.Note[]> {
        return new Promise<Type.Note[]>((resolve, reject) => {
            const req = http.request({
                protocol: 'http',
                hostname: LEANOTE_HOST,
                path: `/api/note/getSyncNotes?${
                    this.JSONToUrlParams({
                        afterUsn,
                        maxEntry
                    })
                }`
            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if(!('Ok' in JsonData)) {
                        resolve(JsonData)
                    } else {
                        reject(JsonData['Msg'])
                    }
                })
            })
            req.end()
        })
    }

    //getNotes 获得某笔记本下的笔记(无内容)
    public getNotes(notebookId: string): Promise<Type.Note[]> {
        return new Promise<Type.Note[]>((resolve, reject) => {
            const req = http.request({
                protocol: 'http',
                method: 'GET',
                hostname: LEANOTE_HOST,
                path: `/api/note/getNotes?${
                    this.JSONToUrlParams({
                        notebookId
                    })
                }`
            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if('Ok' in JsonData) {
                        reject(JsonData['Msg'])
                    } else {
                        resolve(JsonData)
                    }
                })
            })
            req.end()
        })
    }

    public getNoteAndContent(noteId: string): Promise<Type.Note> {
        return new Promise<Type.Note>((resolve, reject) => {
            const req = http.request({
                protocol: 'http',
                method: 'GET',
                hostname: LEANOTE_HOST,
                path: `/api/note/getNoteAndContent?${
                    this.JSONToUrlParams({
                        noteId
                    })
                }`
            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if('Ok' in JsonData) {
                        reject(JsonData['Msg'])
                    } else {
                        resolve(JsonData)
                    }
                })
            })
            req.end()
        })
    }

    public getNoteContent(noteId: string): Promise<Type.NoteContent> {
        return new Promise<Type.NoteContent>((resolve, reject) => {
            const req = http.request({
                protocol: 'http',
                method: 'GET',
                hostname: LEANOTE_HOST,
                path: `/api/note/getNoteContent?${
                    this.JSONToUrlParams({
                        noteId
                    })
                }`
            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if('Ok' in JsonData) {
                        reject(JsonData['Msg'])
                    } else {
                        resolve(JsonData)
                    }
                })
            })
            req.end()
        })
    }

    public addMarkdownNote(note: Type.Note, abstract?: string): Promise<Type.Note> {
        return new Promise<Type.Note>((resolve, reject) => {
            let params = {
                NotebookId: note.NotebookId,
                Title: note.Title,
                Content: note.Content,
                IsMarkdown: true,
                CreatedTime: note.CreatedTime,
                UpdatedTime: note.UpdateTime,
                Abstract: abstract
            }
            if ('Files' in note) {
                params['Files'] = note.Files
            }

            const req = http.request({
                protocol: 'http',
                method: 'POST',
                hostname: LEANOTE_HOST,
                path: `/api/note/addNote?${
                    this.JSONToUrlParams({
                        params
                    })
                }`
            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if('Ok' in JsonData) {
                        reject(JsonData['Msg'])
                    } else {
                        resolve(JsonData)
                    }
                })
            })
            req.end()
        })

    }

    public updateNote(note: Type.Note, abstract?: string): Promise<Type.Note> {
        return new Promise<Type.Note>((resolve, reject) => {
            // 判断更新的参数
            const params = this.JSONToUrlParams(
                this.getNoteAndContent(note.NoteId)
                .then(value => {
                    Object.keys(value).filter(key => {
                        // 属性相等说明未更新
                        if (value[key] === note[key]) {
                            return false
                        } else { //比较属性的子属性是否相等 
                            return (():boolean => {
                                
                                for(let k of Object.keys(value[key])) {
                                    if (value[key][k] !== note[key][k]){
                                        return true
                                    }
                                }
                                return false
                            })()
                        }
                    })
                })
            )

            const req = http.request({
                protocol: 'http',
                method: 'POST',
                hostname: LEANOTE_HOST,
                path: `/api/note/updateNote?${params}`
            }, res => {
                res.setEncoding('utf8')
                res.on('data', data => {
                    const JsonData = JSON.parse(<string>data)
                    if('Ok' in JsonData) {
                        reject(JsonData['Msg'])
                    } else {
                        resolve(JsonData)
                    }
                })
            })
            req.end()
        })
    }
}
