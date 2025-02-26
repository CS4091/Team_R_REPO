export type IResult<T> = [ T, null ] | [ null, any ]
 
export async function maybe<T>(fn: Promise<T>): Promise<IResult<T>> {
    try {
        const result = await fn;
        return [ result, null ]
    }
    catch (error) {
        return [ null, error ] 
    }
}


