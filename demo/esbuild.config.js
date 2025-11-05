const esbuild = require('esbuild');
const path = require('path');

// 添加一个时间戳 banner，确保每次构建输出文件变化，便于浏览器缓存失效
const buildVersion = Date.now();

// 浏览器环境打包 demo/app.ts 和 demo/node-editor-app.ts
// 因为库内部用到了 'crypto'（Node），这里使用轻量 polyfill 替代实现 sha1。

const defineSha1 = () => ({
	name: 'sha1-polyfill',
	setup(build) {
		build.onLoad({ filter: /demo\/(app|node-editor-app)\.ts$/ }, async (args) => {
			const fs = require('fs');
			const code = fs.readFileSync(args.path, 'utf8');
			const prefix = `
			(function(){
				if (typeof window !== 'undefined' && !window._sha1) {
					// 极简 sha1 占位（非安全，仅为 demo 在浏览器运行）
					// 实际项目建议使用成熟库如 js-sha1
					window._sha1 = (s)=>{
						let h=0; const t=String(s);
						for(let i=0;i<t.length;i++){h=(h<<5)-h+t.charCodeAt(i);h|=0}
						return ('0000000'+(h>>>0).toString(16)).slice(-8).repeat(5).slice(0,40);
					};
				}
			})();
			`;
			return { contents: prefix + code, loader: 'ts' };
		});
	}
});

const aliasModules = () => ({
	name: 'alias-modules',
	setup(build) {
		build.onResolve({ filter: /^crypto$/ }, () => ({
			path: path.resolve(__dirname, 'crypto-shim.js')
		}));

		build.onResolve({ filter: /^table-git$/ }, () => ({
			path: path.resolve(__dirname, '../src/index.ts')
		}));
	}
});

const commonOptions = {
	banner: { js: `// build-version:${buildVersion}` },
	bundle: true,
	format: 'iife',
	platform: 'browser',
	sourcemap: true,
	loader: { '.ts': 'ts' },
	tsconfig: 'tsconfig.json',
	logLevel: 'info',
	minify: false
};

async function buildAll() {
	await Promise.all([
		esbuild.build({
			...commonOptions,
			entryPoints: ['demo/app.ts'],
			outfile: 'demo/bundle.js',
					plugins: [aliasModules(), defineSha1()]
		}),
		esbuild.build({
			...commonOptions,
			entryPoints: ['demo/node-editor-app.ts'],
					outfile: 'demo/node-editor-bundle.js',
					plugins: [aliasModules(), defineSha1()]
		})
	]);
	console.log('[build] bundles generated with version', buildVersion);
}

buildAll().catch(() => process.exit(1));

