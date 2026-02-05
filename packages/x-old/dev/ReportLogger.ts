export function useReportLogger(reportName?: string): [(lines: string[])=> void, ()=>void] {
    const report: string[] = [];
    function addToReport(lines: string[]) {
        report.concat(lines);
    }

    function logReport() {
        console.log("")
        console.log("---")
        if (reportName) console.log(reportName)
        for (const line of report) {
            console.log(line);
        }
        console.log("---")
        console.log("")
        report.length = 0;
    }

    return [
        addToReport,
        logReport
    ]
}