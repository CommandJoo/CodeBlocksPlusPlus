# CodeBlocks++
[CodeBlocks++](https://github.com/CommandJoo/CodeBlocksPlusPlus) is a plugin for Obsidian that allows you to define custom Codeblocks
which can be highlighted and executed. It allows for general customization aswell as individual styling using metadata properties.

> Note that this plugin will execute programs defined by the User.
You should never run any programs or code that you dont understand or dont trust the author completely.

![img.png](images/example.png)

## Installation
Go into your Obsidian Vault
```sh
cd .obsidian/plugins
git clone https://github.com/CommandJoo/CodeBlocksPlusPlus.git
```
Go into your Obsidian Settings / Community Plugins and enable it.

Or install it directly via the Obsidian Community Plugins portal

## Usage
### Codeblock Syntax
To use executable Codeblocks define a Codeblock with the language "cbpp". This language should ideally be registered in your settings under [Registered Languages](#registering-languages)

Settings for a specific Codeblock can be specified by the "@cbpp:" prefix.
~~~markdown
```cbpp
@cbpp:lang=js
@cbpp:theme=monokai
@cbpp:input=false
function hello() {
	console.log("Hello, World!");
}
```
~~~~

These settings will automatically removed by the renderer.

Alternatively you can also allow inline metadata in the settings allowing, the codeblock to define the language directly inside the first line.
~~~markdown
```cbpp js
function hello() {
	console.log("Hello, World!");
}
```
~~~
This allows for a much cleaner syntax.

### List of Codeblock Settings
| Setting  | Value      | Description                                                                                          |
|----------|------------|------------------------------------------------------------------------------------------------------|
| 	lang     | \<string>  | A language provided by Shikis bundled languages                                                      |
| theme    | \<string>  | A theme provided by Shiki used for syntax highlighting *(overwrites the settings value)*             |
| numbers  | \<boolean> | Whether or not line numbers should be displayed                    *(overwrites the settings value)* |
| runnable | \<boolean> | Whether or not the Codeblock will be executable *(overwrites the settings value)*                    |
| input    | \<boolean> | Whether or not there should be an input field for the user *(overwrites the settings value)*         |
| buttons  | \<boolean> | Whether or not buttons for running, stopping, and copying are displayed                              |

### Registering Languages
In order to execute Codeblocks you need to register languages with an interpreter 
in the Settings tab of this Plugin

| Field      | Value                 | Description                                                                                                                                                                                                             |
|------------|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Name       | \<string>             | The default name of the language, to be primarily used for the lang [Codeblock property](#list-of-codeblock-settings)                                                                                                   |
| Aliases    | \<string>             | A comma seperated string of alternative names to specify the language for a Codeblock                                                                                                                                   |
| Executable | \<string> & \<string> | The first field specifies the path to the executable binary file of the interpreter you want to use to run this language. The second one specifies any additional flags or arguments you want to pass to the executable |
| Preamble   | \<multiline string>   | Lets you specify code you want to run before each Codeblock written in that language. For example things like imports or constants                                                                                      |

Languages can also always be deleted if they aren't provided by the plugin by default.

## Credits
- [Shiki](https://github.com/shikijs/shiki), used for Syntax highlighting in rendered Codeblocks

## If this plugin has helped you consider giving it a ⭐
