import * as path from "path"
import * as fs from "fs"

export const createFolderIfNotExists=(folderUrl:string)=>{
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

export const logMessageDateInterval=(startDate:Date,endDate:Date,prefix:string = "")=>{
    let seconds = Math.round((endDate.getTime() - startDate.getTime()) / 1000);
    let prefixToAdd = ""
    if(prefix){
        prefixToAdd = `${prefix}::`
    }
    return `${prefixToAdd}Init >> ${startDate}::end>>${endDate}::time taken(seconds) >> ${seconds}`
}