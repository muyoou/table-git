const esbuild = require('esbuild');
const path = require('path');

// 添加一个时间戳 banner，确保每次构建输出文件变化，便于浏览器缓存失效
const buildVersion = Date.now();

// 浏览器环境打包 demo/app.ts -> demo/bundle.js
// 因为库内部用到了 'crypto'（Node），这里使用轻量 polyfill 替代实现 sha1。

const defineSha1 = () => ({
	name: 'sha1-polyfill',
	setup(build) {
		// 用简单实现替换 utils/hash.ts 中的 Node crypto 用法
		// 这里不改源码，而是通过注入全局 window._sha1 简化（demo 用途，非生产）
		build.onLoad({ filter: /demo\/app\.ts$/ }, async (args) => {
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

	const aliasCrypto = () => ({
		name: 'alias-crypto',
		setup(build) {
			build.onResolve({ filter: /^crypto$/ }, () => ({
				path: path.resolve(__dirname, 'crypto-shim.js')
			}));
		}
	});

esbuild.build({
	entryPoints: ['demo/app.ts'],
	outfile: 'demo/bundle.js',
	banner: { js: `// build-version:${buildVersion}` },
	bundle: true,
	format: 'iife',
	platform: 'browser',
	sourcemap: true,
	plugins: [aliasCrypto(), defineSha1()],
	loader: { '.ts': 'ts' },
	tsconfig: 'tsconfig.json',
	logLevel: 'info',
	// 不丢弃 console，显式关闭 minify 以便调试
	minify: false,
}).then(()=>{
	console.log('[build] bundle generated with version', buildVersion);
}).catch(() => process.exit(1));

