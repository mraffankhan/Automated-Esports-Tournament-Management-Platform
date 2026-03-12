"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Loader2, Database, Table, AlertCircle, RefreshCw, Trash2, Edit2, Plus, ChevronLeft, ChevronRight, Search, Menu, X, Server } from "lucide-react";

export default function AdminDatabasePage() {
    const [tables, setTables] = useState<string[]>([]);
    const [filteredTables, setFilteredTables] = useState<string[]>([]);
    const [searchTable, setSearchTable] = useState("");

    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [tableData, setTableData] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [storageStats, setStorageStats] = useState<{ usedBytes: number, totalBytes: number } | null>(null);
    const [page, setPage] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const router = useRouter();
    const DEVS = ["1449081308616720628"];

    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    router.push("/");
                    return;
                }

                const data = await res.json();
                if (!data.authenticated || !data.user) {
                    router.push("/");
                    return;
                }

                const discordId = data.user.id;
                if (!DEVS.includes(discordId)) {
                    setError("You are not authorized to view this page.");
                    setLoading(false);
                    return;
                }

                setUser(data.user);
                await fetchTables(discordId);
            } catch (err) {
                console.error(err);
                router.push("/");
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (searchTable.trim() === "") {
            setFilteredTables(tables);
        } else {
            setFilteredTables(tables.filter(t => t.toLowerCase().includes(searchTable.toLowerCase())));
        }
    }, [searchTable, tables]);

    const fetchTables = async (userId: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/db/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setTables(data.tables || []);
            setFilteredTables(data.tables || []);
            if (data.storage) {
                setStorageStats(data.storage);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTableData = async (tableName: string, pageIndex = 0) => {
        if (!user) return;
        setSelectedTable(tableName);
        setPage(pageIndex);
        setDataLoading(true);
        setError(null);
        setSidebarOpen(false);

        try {
            const colRes = await fetch('/api/admin/db/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    action: 'read_columns',
                    table: tableName
                })
            });
            const colData = await colRes.json();
            if (colData.error) throw new Error(colData.error);
            setColumns(colData.data || []);

            const dataRes = await fetch('/api/admin/db/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    action: 'read',
                    table: tableName,
                    payload: { offset: pageIndex * 100 }
                })
            });
            const rowData = await dataRes.json();
            if (rowData.error) throw new Error(rowData.error);
            setTableData(rowData.data || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setDataLoading(false);
        }
    };

    const handleDelete = async (row: any) => {
        if (!confirm("Are you sure you want to delete this row?")) return;

        const idCol = columns.find(c => c.column_name === 'id' || c.column_name === 'guild_id' || c.column_name.endsWith('_id'));
        if (!idCol) {
            alert("Could not identify a primary key to delete this row safely.");
            return;
        }

        try {
            const res = await fetch('/api/admin/db/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    action: 'delete',
                    table: selectedTable,
                    payload: {
                        idField: idCol.column_name,
                        idValue: row[idCol.column_name]
                    }
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            fetchTableData(selectedTable!, page);
        } catch (err: any) {
            alert("Error deleting row: " + err.message);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                    <Loader2 size={56} className="text-primary animate-spin relative z-10" />
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-5 text-center px-4">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                    <AlertCircle size={40} className="text-red-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Access Denied</h1>
                    <p className="text-red-400 max-w-sm mx-auto">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(171,72,209,0.15),rgba(0,0,0,0))] pt-24 pb-12 px-2 sm:px-6 relative flex flex-col md:flex-row gap-6">

            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md shadow-lg">
                <h2 className="font-bold text-white flex items-center gap-2">
                    <Database className="text-primary" size={20} />
                    {selectedTable ? selectedTable : "Select Database Table"}
                </h2>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-white">
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Sidebar (Tables List) */}
            <div className={`
                absolute md:relative z-20 w-full md:w-80 flex-shrink-0 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex-col h-[70vh] md:h-[calc(100vh-140px)] transition-all duration-300 ease-in-out shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]
                ${sidebarOpen ? 'flex top-40 left-0 px-2' : 'hidden md:flex'}
            `}>
                <div className="p-5 border-b border-white/10 bg-white/[0.02] flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                            <Server className="text-primary" size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-white/90 text-lg tracking-wide leading-tight">Ender DB</h2>
                            <p className="text-xs text-primary/80 font-medium">Remote Connection</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Find table..."
                            value={searchTable}
                            onChange={(e) => setSearchTable(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-1 custom-scrollbar">
                    {filteredTables.length > 0 ? filteredTables.map(table => (
                        <button
                            key={table}
                            onClick={() => fetchTableData(table, 0)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all duration-300 ${selectedTable === table
                                ? 'bg-primary/10 text-primary font-bold border border-primary/20 shadow-[0_0_20px_rgba(171,72,209,0.15)] ring-1 ring-primary/30 translate-x-1'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                }`}
                        >
                            <Table size={16} className={selectedTable === table ? "text-primary" : "opacity-50"} />
                            <span className="truncate tracking-wide">{table}</span>
                        </button>
                    )) : (
                        <div className="text-center text-gray-500 py-8 text-sm flex flex-col items-center gap-2">
                            <Search size={24} className="opacity-20" />
                            <span>No tables matching "{searchTable}"</span>
                        </div>
                    )}
                </div>

                {/* Storage Widget */}
                {storageStats && (
                    <div className="p-5 border-t border-white/10 bg-gradient-to-t from-black/80 to-black/20 mt-auto backdrop-blur-md">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5"><Database size={14} className="text-gray-400" /> Capacity</span>
                            <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 shadow-[0_0_10px_rgba(171,72,209,0.2)]">
                                {((storageStats.usedBytes / storageStats.totalBytes) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-black/60 border border-white/5 h-2.5 rounded-full overflow-hidden mb-2.5 shadow-inner">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(171,72,209,0.6)]"
                                style={{ width: `${Math.max(1, Math.min(100, (storageStats.usedBytes / storageStats.totalBytes) * 100))}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span className="text-gray-300">{formatBytes(storageStats.usedBytes)}</span>
                            <span>{formatBytes(storageStats.totalBytes)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area (Data Viewer) */}
            <div className="flex-1 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
                {selectedTable ? (
                    <>
                        <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
                            <h2 className="font-bold text-white text-xl md:text-2xl flex items-center gap-2.5 tracking-tight">
                                <div className="p-1.5 bg-primary/20 rounded border border-primary/30 shadow-[0_0_10px_rgba(171,72,209,0.2)]">
                                    <Table className="text-primary" size={22} />
                                </div>
                                {selectedTable}
                                <span className="text-xs font-medium text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 ml-2 uppercase tracking-wider">
                                    {tableData.length || 0} rows
                                </span>
                            </h2>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                {/* Pagination Controls */}
                                <div className="flex items-center bg-black/60 border border-white/10 rounded-xl overflow-hidden shadow-inner">
                                    <button
                                        onClick={() => fetchTableData(selectedTable, Math.max(0, page - 1))}
                                        disabled={page === 0}
                                        className="p-2 sm:px-3 sm:py-2 text-gray-400 hover:text-white hover:bg-white/10 hover:bg-primary/20 active:bg-primary/30 disabled:opacity-20 transition-all"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="px-3 sm:px-4 text-sm text-primary font-mono font-medium border-x border-white/10">
                                        Pg {page + 1}
                                    </span>
                                    <button
                                        onClick={() => fetchTableData(selectedTable, page + 1)}
                                        disabled={tableData.length < 100}
                                        className="p-2 sm:px-3 sm:py-2 text-gray-400 hover:text-white hover:bg-white/10 hover:bg-primary/20 active:bg-primary/30 disabled:opacity-20 transition-all"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => fetchTableData(selectedTable, page)}
                                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all border border-white/5 hover:border-white/20 active:scale-95 flex items-center justify-center group"
                                    title="Refresh Data"
                                >
                                    <RefreshCw size={18} className={dataLoading ? "animate-spin text-primary" : "group-hover:text-white"} />
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-white text-black font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(171,72,209,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] active:scale-95 border border-transparent">
                                    <Plus size={18} />
                                    <span className="hidden sm:inline">Add Row</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-[#0a0a0a]/50 p-0 sm:p-5 relative">
                            {/* Inner Radial Glow under table */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[100px] pointer-events-none rounded-full" />

                            {dataLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-5 z-10 relative">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse"></div>
                                        <Loader2 size={48} className="text-primary animate-spin relative z-10" />
                                    </div>
                                    <p className="text-gray-400 font-medium tracking-wide">Querying remote database...</p>
                                </div>
                            ) : error ? (
                                <div className="m-5 p-5 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl flex items-start gap-4 shadow-[0_10px_30px_rgba(239,68,68,0.1)] backdrop-blur-md relative z-10">
                                    <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-bold text-red-400 text-lg">Query Execution Failed</h3>
                                        <p className="text-sm mt-1.5 leading-relaxed opacity-90">{error}</p>
                                    </div>
                                </div>
                            ) : tableData.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 z-10 relative">
                                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] border border-white/5">
                                        <Table size={36} className="text-gray-600" />
                                    </div>
                                    <p className="text-xl font-bold text-gray-300">No data found</p>
                                    <p className="text-sm text-gray-500/80 max-w-xs text-center">Page {page + 1} of <span className="text-gray-400">{selectedTable}</span> is currently empty.</p>
                                </div>
                            ) : (
                                <div className="border-y sm:border sm:rounded-2xl border-white/10 overflow-hidden shadow-2xl bg-[#0d0d0d] relative z-10">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-max">
                                            <thead>
                                                <tr className="bg-[#151515] border-b border-white/10 text-[11px] text-gray-400 uppercase tracking-widest">
                                                    <th className="p-4 w-20 text-center sticky left-0 bg-[#1a1a1a] border-r border-white/5 z-20 shadow-[4px_0_15px_rgba(0,0,0,0.3)] font-bold">Actions</th>
                                                    {columns.map(col => (
                                                        <th key={col.column_name} className="p-4 font-semibold text-gray-300 group">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-white/90">{col.column_name}</span>
                                                                <span className="text-[10px] text-primary/70 font-mono tracking-normal normal-case opacity-80 group-hover:opacity-100 transition-opacity">{col.data_type}</span>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {tableData.map((row, i) => (
                                                    <tr key={i} className="hover:bg-white/[0.04] transition-colors group">
                                                        <td className="p-3 flex items-center justify-center gap-2 sticky left-0 bg-[#0d0d0d] group-hover:bg-[#161616] border-r border-white/5 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.2)] transition-colors">
                                                            <button className="p-2 text-blue-400 bg-blue-400/5 hover:bg-blue-400/20 hover:text-blue-300 rounded-lg opacity-50 sm:opacity-0 group-hover:opacity-100 transition-all border border-blue-400/10 active:scale-95">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row)}
                                                                className="p-2 text-red-500 bg-red-500/5 hover:bg-red-500/20 hover:text-red-400 rounded-lg opacity-50 sm:opacity-0 group-hover:opacity-100 transition-all border border-red-500/10 active:scale-95">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                        {columns.map(col => {
                                                            const val = row[col.column_name];
                                                            const isNull = val === null;
                                                            const isBool = typeof val === 'boolean' || val === 1 || val === 0;
                                                            const displayVal = isNull ? "NULL" :
                                                                typeof val === 'object' ? JSON.stringify(val) :
                                                                    String(val);

                                                            return (
                                                                <td key={col.column_name} className="p-4 text-gray-300 max-w-[350px]" title={displayVal}>
                                                                    <div className="truncate">
                                                                        {isNull ? (
                                                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-500 italic text-[11px] border border-white/5 font-mono shadow-inner">NULL</span>
                                                                        ) : (
                                                                            <span className={`
                                                                                ${typeof val === 'number' ? 'text-blue-300 font-mono text-[13px] bg-blue-400/10 px-1.5 py-0.5 rounded' : ''}
                                                                                ${typeof val === 'string' && val.startsWith('{') ? 'text-green-300 font-mono text-[13px] opacity-90' : ''}
                                                                                ${isBool ? 'text-yellow-500 font-medium' : ''}
                                                                            `}>
                                                                                {displayVal}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-6 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(171,72,209,0.1),transparent)] pointer-events-none"></div>
                        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center mb-2 border border-primary/20 shadow-[0_0_50px_rgba(171,72,209,0.15)] relative backdrop-blur-sm -rotate-3 overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 transform rotate-45 scale-150"></div>
                            <Database size={48} className="text-primary/80 relative z-10 drop-shadow-lg" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">Database Explorer</h3>
                            <p className="text-gray-400 max-w-md leading-relaxed text-[15px]">
                                Welcome to the Developer Control Panel. Select any remote table from the unified sidebar to safely inspect, modify, or sync your MySQL datasets.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(0,0,0,0.5);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(171, 72, 209, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-corner {
                    background: transparent;
                }
            `}</style>
        </div>
    );
}
