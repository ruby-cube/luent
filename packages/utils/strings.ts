export function isUppercase(characters: string){
    return characters.toUpperCase() === characters;
}

export function camelToKebabCase(input: string) {
   return input
       .replace(/([a-z])([A-Z])/g, '$1-$2') // Add a dash between lowercase and uppercase letters
       .toLowerCase(); // Convert the entire string to lowercase
}