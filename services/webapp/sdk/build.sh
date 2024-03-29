 echo "Generation du SDK ..."
 # Pour customiser la génération, s'appuyer sur ce projet : https://github.com/mgechev/swagger-typescript-fetch-api
 # CONFIG OPTIONS
 #        sortParamsByRequiredFlag
 #            Sort method arguments to place required parameters before optional parameters. (Default: true)
 #        ensureUniqueParams
 #            Whether to ensure parameter names are unique in an operation (rename parameters that are not). (Default: true)
 #        allowUnicodeIdentifiers
 #            boolean, toggles whether unicode identifiers are allowed in names or not, default is false (Default: false)
 #        modelPropertyNaming
 #            Naming convention for the property: 'camelCase', 'PascalCase', 'snake_case' and 'original', which keeps the original name (Default: camelCase)
 #        supportsES6
 #            Generate code that conforms to ES6. (Default: false)
 #        npmName
 #            The name under which you want to publish generated npm package
 #        npmVersion
 #            The version of your npm package
 #        npmRepository
 #            Use this property to set an url your private npmRepo in the package.json
 #        snapshot
 #            When setting this property to true the version will be suffixed with -SNAPSHOT.yyyyMMddHHmm (Default: false)
 #        withInterfaces
 #            Setting this property to true will generate interfaces next to the default class implementations. (Default: false)
 java -jar openapi-generator-cli-4.2.3.jar generate -i http://localhost:9090/api-json -g typescript-fetch --skip-validate-spec --additional-properties=supportsES6=true,typescriptThreePlus=true -o ../src/sdk/
