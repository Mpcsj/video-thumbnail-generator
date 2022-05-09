import * as path from "path"
import * as fs from "fs"

export const createFolderIfNotExists=(folderUrl:string)=>{
    console.log(`createFolderIfNotExists>>${folderUrl}`)
    if(!fs.existsSync(folderUrl)){
        fs.mkdirSync(folderUrl)
    }
}

export const getDataFolderUrl = ()=>{
    const currentPath = __dirname
    // using sep, it works for any OS
    const splitted = currentPath.split(path.sep)
    splitted.pop()// remote dist folder
    splitted.push("data")
    const res = `${path.sep}${path.join(...splitted)}`
    createFolderIfNotExists(res)
    return res
}

export const getSubDataFolder=(baseUrl:string,foldername:string,createIfNotExists:boolean = true)=>{
    const res = path.resolve(baseUrl,foldername)
    if(createIfNotExists){
        createFolderIfNotExists(res)
    }
    return res
}