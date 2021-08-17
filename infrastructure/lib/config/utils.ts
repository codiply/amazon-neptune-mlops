export function getString(object: { [name: string]: any }, propertyName: string): string
{
    if(!object[propertyName] || object[propertyName].toString().trim().length === 0)
        throw new Error('Property '+propertyName +' does not exist or is empty');

    return object[propertyName].toString();
}
export function getStringList(object: { [name: string]: any }, propertyName: string): string[]
{
    if(!object[propertyName])
        throw new Error('Property '+propertyName +' does not exist');

    return object[propertyName];
}

export function getBoolean(object: { [name: string]: any }, propertyName: string): boolean
{
    return getString(object, propertyName).toLowerCase() == 'true';
}

export function getNumber(object: { [name: string]: any }, propertyName: string): number
{
    if(!object[propertyName])
        throw new Error('Property '+propertyName +' does not exist');

    return object[propertyName];
}

export function getSection(object: { [name: string]: any }, sectionName: string): { [name: string]: any }
{
    if(!object[sectionName])
        throw new Error('Section '+sectionName +' does not exist');

    return object[sectionName];
}