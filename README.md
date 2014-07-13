# Hw2-Bower - Universal package manager

Official README and LICENSE on (https://github.com/bower/bower)  

See [bower-pullrequest](https://github.com/hw2-core/bower/tree/bower-pullrequest) branch for changes that concern only bower

hw2-bower is also on npm https://www.npmjs.org/package/hw2core-bower

> npm install hw2core-bower

The commands are same of original bower but the binary is called "hw2-bower" to avoid collision

### Actually hw2-bower supports:

1) the installation of packages that use forward slashes in names. So you can use:

"hw2-bower install vendor/lib/mylib"  -> this package will be installed in same path specified by the name

2) you can keep .git folder when not in --production mode. This allow you to work with your repository.

3) you can use the special character "%" for dependencies name to use original package name as directory
    instead of specifying it. However the dependency name must be defined and be unique for json consistency.  Ex:

> dependencies: {
>   "%js-library" : "git://github.com/hw2-core/js-library.git"     -->  it will be installed in Hw2/Js/library ( retrieved from package bower.json )
> }


features implemented in hw2core-bower needed for hw2core itself , and some of them could not be merged with official repository just for rejected requests by the official team ( https://github.com/bower/bower/pull/1390 )

### Core team

* [@yehonal](https://github.com/yehonal)
