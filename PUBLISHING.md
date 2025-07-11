# Publishing Checklist

## Pre-Publishing Steps

### 1. Verify Package Information
- [x] Package name updated to `@mkisida/node-red-contrib-function-editor`
- [x] Author field set to "Michael Kisida"
- [x] Version is set correctly (currently 1.0.0)
- [x] Description is comprehensive and accurate
- [x] Keywords are relevant and help with discoverability
- [x] Repository URLs are correct
- [x] License is ISC with proper LICENSE file

### 2. Build and Test
- [x] Run `npm run build` - builds successfully
- [x] Test the package locally
- [x] Verify all dependencies are correct
- [x] Check that .npmignore excludes development files
- [x] Verify dist/src/index.html is included in package (fixed .npmignore)

### 3. Documentation
- [x] Comprehensive README.md with installation and usage instructions
- [x] LICENSE file included
- [x] All example code is tested and working

## Publishing Steps

### 1. Login to npm
```bash
npm login
```

### 2. Check what will be published
```bash
npm pack --dry-run
```

### 3. Publish to npm
```bash
npm publish --access public
```

Note: The `--access public` flag is required for scoped packages to be publicly available.

### 4. Verify Publication
- Check package on npmjs.com: https://www.npmjs.com/package/@mkisida/node-red-contrib-function-editor
- Test installation: `npm install @mkisida/node-red-contrib-function-editor`

## Post-Publishing Steps

### 1. Update GitHub
- Push all changes to GitHub
- Create a release tag: `git tag v1.0.0 && git push origin v1.0.0`
- Create a GitHub release with changelog

### 2. Update Node-RED Flow Library
- Submit package to Node-RED Flow Library: https://flows.nodered.org/

### 3. Announce
- Share on Node-RED forum
- Update personal/company documentation
- Consider blog post or social media announcement

## Version Updates (Future)

When updating versions:
1. Update version in package.json
2. Update CHANGELOG in README.md
3. Test thoroughly
4. Run build process
5. Publish with `npm publish`

## Important Notes

- This is a scoped package under @mkisida
- Requires `--access public` flag for public publishing
- Package includes built frontend assets in /dist/
- Functions directory is excluded from package (user-generated content)
- Build process is required before publishing (handled by prepack script) 