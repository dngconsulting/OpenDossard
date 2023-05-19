import { jsPDF } from 'jspdf';
import { CompetitionEntity, LicenceEntity, RaceRow } from '../sdk';
import { capitalizeFirstLetter, displayDossard } from '../util';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import _ from 'lodash';

export const resultsPDF = (
  races: string[],
  rows,
  competition: CompetitionEntity,
  transformRows,
  filterByRace,
  displayRankOfCate,
  getChallengeWinners
) => {
  const filename =
    'Clt_' + competition.name.toString().replace(/\s/g, '') + '_cate_' + races.toString().replace(/\s/g, '') + '.pdf';
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  const avecTours = rows.filter(row => row.tours).length > 0;
  races.forEach((currentRace: string, pageIndex: number) => {
    const rowstoDisplay: any[][] = [];
    const filteredRowsByRace = transformRows(filterByRace(rows, currentRace));

    filteredRowsByRace.forEach((r: RaceRow) => {
      (r.rankingScratch || r.comment) &&
        rowstoDisplay.push([
          r.rankingScratch,
          displayRankOfCate(r, filteredRowsByRace),
          displayDossard(r.riderNumber.toString()),
          r.name,
          r.club,
          r.gender,
          r.catev,
          r.catea,
          r.fede,
          ...[competition.avecChrono ? r.chrono : []],
          ...[avecTours ? r.tours && r.tours + 'T' : []]
        ]);
    });
    // @ts-ignore
    autoTable(doc, {
      head: [
        [
          'Scrat.',
          'Cat.',
          'Doss',
          'Coureur',
          'Club',
          'H/F',
          'Caté.V',
          'Caté.A',
          'Fédé',
          ...[competition.avecChrono ? 'Temps' : []],
          ...[avecTours ? 'Tours' : []]
        ]
      ],
      headStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 0.5,
        minCellHeight: 8
      },
      bodyStyles: {
        minCellHeight: 3,
        cellPadding: 0.5
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 'auto' },
        7: { cellWidth: 'auto' },
        8: { cellWidth: 'auto' },
        9: { cellWidth: competition.avecChrono ? 'auto' : 0 },
        10: { halign: 'left', cellWidth: avecTours ? 'auto' : 0 }
      },
      body: rowstoDisplay,
      didDrawPage: (data: any) => {
        // Header
        doc.setFontSize(13);
        doc.setTextColor(40);
        //doc.setFontStyle('normal');
        if (competition.fede === 'FSGT') {
          doc.addImage(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABUCAYAAAB0mJL5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAADesaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzE0NSA3OS4xNjM0OTksIDIwMTgvMDgvMTMtMTY6NDA6MjIgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOmlsbHVzdHJhdG9yPSJodHRwOi8vbnMuYWRvYmUuY29tL2lsbHVzdHJhdG9yLzEuMC8iIHhtbG5zOnhtcFRQZz0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3QvcGcvIiB4bWxuczpzdERpbT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL0RpbWVuc2lvbnMjIiB4bWxuczp4bXBHPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvZy8iIHhtbG5zOnBkZj0iaHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0wNy0wNVQxMzozMTozMyswMjowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTktMDctMDVUMTM6MzE6MzMrMDI6MDAiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTA2LTI0VDEwOjA0OjQwKzAyOjAwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIElsbHVzdHJhdG9yIENDIDIzLjAgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ZDg5NTNmYmYtOTY0ZS00ZDE0LWE4MzEtNmMzYmI5ZTBmZDQwIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NjAwMjJhMzEtYjc4OS0zOTRjLTkyMDQtMjA4Nzc2ZGFjOTZkIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InV1aWQ6NUQyMDg5MjQ5M0JGREIxMTkxNEE4NTkwRDMxNTA4QzgiIHhtcE1NOlJlbmRpdGlvbkNsYXNzPSJwcm9vZjpwZGYiIGlsbHVzdHJhdG9yOlR5cGU9IkRvY3VtZW50IiBpbGx1c3RyYXRvcjpTdGFydHVwUHJvZmlsZT0iUHJpbnQiIHhtcFRQZzpIYXNWaXNpYmxlT3ZlcnByaW50PSJGYWxzZSIgeG1wVFBnOkhhc1Zpc2libGVUcmFuc3BhcmVuY3k9IkZhbHNlIiB4bXBUUGc6TlBhZ2VzPSIxIiBwZGY6UHJvZHVjZXI9IkFkb2JlIFBERiBsaWJyYXJ5IDE1LjAwIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8ZGM6dGl0bGU+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPmxvZ29GU0dUc3ArdHh0X3NiPC9yZGY6bGk+IDwvcmRmOkFsdD4gPC9kYzp0aXRsZT4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NjBlZDI2YTgtYWJmMS00M2JlLTk4OTktOTJmNWM1N2JjYTY4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjI1NTM4OTMyLTYzZjItNDNjMy04ZGMxLTA2ZTFmMTYyYzQzNyIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ1dWlkOjVEMjA4OTI0OTNCRkRCMTE5MTRBODU5MEQzMTUwOEM4IiBzdFJlZjpyZW5kaXRpb25DbGFzcz0icHJvb2Y6cGRmIi8+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmQ2NjJmZTNhLTgzNGYtNGI3NS05Zjk2LTFhYzVmYWExNTRlMiIgc3RFdnQ6d2hlbj0iMjAxOS0wNi0xNFQwOTo0OToyOCswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgSWxsdXN0cmF0b3IgQ0MgMjMuMCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmZlMDk5MjItMDRmNS00OWM1LWJmZWUtYjE4MzViOWRjZGRkIiBzdEV2dDp3aGVuPSIyMDE5LTA2LTI0VDEwOjA0OjM4KzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBJbGx1c3RyYXRvciBDQyAyMy4wIChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjb252ZXJ0ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImZyb20gYXBwbGljYXRpb24vcGRmIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImRlcml2ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvdGlmZiIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MjU1Mzg5MzItNjNmMi00M2MzLThkYzEtMDZlMWYxNjJjNDM3IiBzdEV2dDp3aGVuPSIyMDE5LTA3LTA1VDEzOjMwOjM2KzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NjBlZDI2YTgtYWJmMS00M2JlLTk4OTktOTJmNWM1N2JjYTY4IiBzdEV2dDp3aGVuPSIyMDE5LTA3LTA1VDEzOjMxOjMzKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGltYWdlL3RpZmYgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBpbWFnZS90aWZmIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZDg5NTNmYmYtOTY0ZS00ZDE0LWE4MzEtNmMzYmI5ZTBmZDQwIiBzdEV2dDp3aGVuPSIyMDE5LTA3LTA1VDEzOjMxOjMzKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHhtcFRQZzpNYXhQYWdlU2l6ZSBzdERpbTp3PSIxOTIuMzQ2MDQyIiBzdERpbTpoPSIxNjYuMTkwNjMxIiBzdERpbTp1bml0PSJNaWxsaW1ldGVycyIvPiA8eG1wVFBnOlBsYXRlTmFtZXM+IDxyZGY6U2VxPiA8cmRmOmxpPkN5YW48L3JkZjpsaT4gPHJkZjpsaT5NYWdlbnRhPC9yZGY6bGk+IDxyZGY6bGk+WWVsbG93PC9yZGY6bGk+IDxyZGY6bGk+QmxhY2s8L3JkZjpsaT4gPC9yZGY6U2VxPiA8L3htcFRQZzpQbGF0ZU5hbWVzPiA8eG1wVFBnOlN3YXRjaEdyb3Vwcz4gPHJkZjpTZXE+IDxyZGY6bGk+IDxyZGY6RGVzY3JpcHRpb24geG1wRzpncm91cE5hbWU9Ikdyb3VwZSBkZSBudWFuY2VzIHBhciBkw6lmYXV0IiB4bXBHOmdyb3VwVHlwZT0iMCI+IDx4bXBHOkNvbG9yYW50cz4gPHJkZjpTZXE+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJCbGFuYyIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9Ik5vaXIiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjEwMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IlJvdWdlIENNSk4iIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iSmF1bmUgQ01KTiIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iVmVydCBDTUpOIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMTAwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkN5YW4gQ01KTiIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMTAwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQmxldSBDTUpOIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9Ik1hZ2VudGEgQ01KTiIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0xNSBNPTEwMCBKPTkwIE49MTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjE1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMDAuMDAwMDAwIiB4bXBHOnllbGxvdz0iOTAuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTkwIEo9ODUgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI5MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI4NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT04MCBKPTk1IE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iODAuMDAwMDAwIiB4bXBHOnllbGxvdz0iOTUuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09NTAgSj0xMDAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI1MC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MzUgSj04NSBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjM1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9Ijg1LjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NSBNPTAgSj05MCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iOTAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0yMCBNPTAgSj0xMDAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIyMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz01MCBNPTAgSj0xMDAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI1MC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz03NSBNPTAgSj0xMDAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI3NS4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz04NSBNPTEwIEo9MTAwIE49MTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49Ijg1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9OTAgTT0zMCBKPTk1IE49MzAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjkwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIzMC4wMDAwMDAiIHhtcEc6eWVsbG93PSI5NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjMwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz03NSBNPTAgSj03NSBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49Ijc1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9Ijc1LjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9ODAgTT0xMCBKPTQ1IE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iODAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjQ1LjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NzAgTT0xNSBKPTAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI3MC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTUuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTg1IE09NTAgSj0wIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iODUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjUwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0xMDAgTT05NSBKPTUgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9Ijk1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjUuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0xMDAgTT0xMDAgSj0yNSBOPTI1IiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIyNS4wMDAwMDAiIHhtcEc6YmxhY2s9IjI1LjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz03NSBNPTEwMCBKPTAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI3NS4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz01MCBNPTEwMCBKPTAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI1MC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0zNSBNPTEwMCBKPTM1IE49MTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjM1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMDAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMzUuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MTAgTT0xMDAgSj01MCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjEwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMDAuMDAwMDAwIiB4bXBHOnllbGxvdz0iNTAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09OTUgSj0yMCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9Ijk1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MjUgTT0yNSBKPTQwIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMjUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjI1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjQwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NDAgTT00NSBKPTUwIE49NSIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjQ1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjUwLjAwMDAwMCIgeG1wRzpibGFjaz0iNS4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NTAgTT01MCBKPTYwIE49MjUiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjUwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI1MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI2MC4wMDAwMDAiIHhtcEc6YmxhY2s9IjI1LjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz01NSBNPTYwIEo9NjUgTj00MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNTUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjYwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjY1LjAwMDAwMCIgeG1wRzpibGFjaz0iNDAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTI1IE09NDAgSj02NSBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjI1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSI0MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI2NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTMwIE09NTAgSj03NSBOPTEwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIzMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iNTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iNzUuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MzUgTT02MCBKPTgwIE49MjUiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjM1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSI2MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI4MC4wMDAwMDAiIHhtcEc6YmxhY2s9IjI1LjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz00MCBNPTY1IEo9OTAgTj0zNSIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjY1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjkwLjAwMDAwMCIgeG1wRzpibGFjaz0iMzUuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTQwIE09NzAgSj0xMDAgTj01MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjcwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjUwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz01MCBNPTcwIEo9ODAgTj03MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNTAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjcwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjgwLjAwMDAwMCIgeG1wRzpibGFjaz0iNzAuMDAwMDAwIi8+IDwvcmRmOlNlcT4gPC94bXBHOkNvbG9yYW50cz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOmxpPiA8cmRmOmxpPiA8cmRmOkRlc2NyaXB0aW9uIHhtcEc6Z3JvdXBOYW1lPSJHcmlzIiB4bXBHOmdyb3VwVHlwZT0iMSI+IDx4bXBHOkNvbG9yYW50cz4gPHJkZjpTZXE+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTEwMCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMTAwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBKPTAgTj05MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iODkuOTk5NDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTgwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSI3OS45OTg4MDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgSj0wIE49NzAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjY5Ljk5OTcwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBKPTAgTj02MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iNTkuOTk5MTAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTUwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSI1MC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgSj0wIE49NDAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjM5Ljk5OTQwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBKPTAgTj0zMCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMjkuOTk4ODAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTIwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIxOS45OTk3MDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgSj0wIE49MTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjkuOTk5MTAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTUiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjQuOTk4ODAwIi8+IDwvcmRmOlNlcT4gPC94bXBHOkNvbG9yYW50cz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOmxpPiA8cmRmOmxpPiA8cmRmOkRlc2NyaXB0aW9uIHhtcEc6Z3JvdXBOYW1lPSJDb3VsZXVycyB2aXZlcyIgeG1wRzpncm91cFR5cGU9IjEiPiA8eG1wRzpDb2xvcmFudHM+IDxyZGY6U2VxPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MTAwIEo9MTAwIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT03NSBKPTEwMCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9Ijc1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0xMCBKPTk1IE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iOTUuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz04NSBNPTEwIEo9MTAwIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iODUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTEwMCBNPTkwIEo9MCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjEwMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iOTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTYwIE09OTAgSj0wIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjkwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAzMTAwIiB4bXBHOmJsYWNrPSIwLjAwMzEwMCIvPiA8L3JkZjpTZXE+IDwveG1wRzpDb2xvcmFudHM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpsaT4gPC9yZGY6U2VxPiA8L3htcFRQZzpTd2F0Y2hHcm91cHM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+KeYCkAAAHRVJREFUeF7tnQd8FFXXh/+b7KaQkIQk1FCCNGkqSK8iqBSpioJ0EJAmqAj6iohgAUVB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',
            'JPEG',
            data.settings.margin.left,
            5,
            30,
            21
          );
        }
        doc.setFontSize(10);
        doc.text('Résultats générés avec Open Dossard (https://www.opendossard.com)', 50, 7);
        doc.setFontSize(13);
        doc.text('Epreuve : ' + competition.name, data.settings.margin.left + 50, 15);
        doc.text(
          'Date : ' +
            capitalizeFirstLetter(
              moment(competition.eventDate)
                .locale('fr')
                .format('dddd DD MMM YYYY')
            ),
          data.settings.margin.left + 50,
          20
        );
        doc.text('Catégorie(s) : ' + currentRace, data.settings.margin.left + 50, 25);
      },
      margin: { top: 30, left: 5, right: 5 },
      styles: {
        valign: 'middle',
        halign: 'left',
        fontSize: 10,
        minCellHeight: 5
      }
    });
    let finalY = (doc as any).lastAutoTable.finalY;
    if (finalY > 240) {
      doc.addPage();
      finalY = 5;
    }
    doc.setTextColor('#424242');
    doc.setFontSize(10);
    //doc.setFontStyle('bold');
    const spText = doc.splitTextToSize(
      'NOMBRE DE COUREURS : ' +
        filteredRowsByRace.length +
        ' en catégorie(s) ' +
        currentRace +
        '\nORGANISATEUR : ' +
        competition.club.longName +
        '\nCOMMISSAIRES : ' +
        (competition.commissaires ? competition.commissaires : 'NC') +
        '\nSPEAKER : ' +
        (competition.speaker ? competition.speaker : 'NC') +
        (competition.competitionType === 'CX'
          ? '\nABOYEUR : ' + (competition.aboyeur ? competition.aboyeur : 'NC')
          : '') +
        '\nREMARQUES : ' +
        (competition.feedback ? competition.feedback : 'NC') +
        '\nVainqueur(s) du challenge : ' +
        getChallengeWinners(filteredRowsByRace),
      600
    );
    doc.text(spText, 5, finalY + 10);
    if (pageIndex + 1 < races.length) {
      doc.addPage();
    }
  });
  doc.setFontSize(10);
  // Footer
  for (let pageNumber = 1; pageNumber <= doc.getNumberOfPages(); pageNumber++) {
    doc.setPage(pageNumber);
    //doc.setFontStyle('normal');

    // jsPDF 1.4+ uses getWidth, <1.4 uses .width
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
    doc.text('Page ' + pageNumber + '/' + doc.getNumberOfPages(), 5, pageHeight - 10);
    doc.text(filename + ' généré à ' + moment().format('HH:mm'), 40, pageHeight - 5);
  }
  doc.save(filename);
};

export const podiumsPDF = async (rows, competition, transformRows, rankOfCate, filterByRace) => {
  const filename = 'Podiums_' + competition.name.replace(/\s/g, '') + '.pdf';
  let doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  const allRankRows = transformRows(rows);
  competition.races
    .join(',')
    .replace(/\//g, ',')
    .split(',')
    .forEach((race: string, index: number) => {
      const podiumsForCurrentRace: any[][] = [];
      let sprintChallenge: RaceRow = null;

      // Put all main federation first
      allRankRows.forEach((r: RaceRow) => {
        const rank = rankOfCate(
          r,
          allRankRows.filter(rows => rows.catev === race)
        );
        if (rank <= 3 && r.catev === race)
          r.rankingScratch &&
            r.comment == null &&
            podiumsForCurrentRace.push([
              rank,
              r.rankingScratch,
              displayDossard(r.riderNumber.toString()),
              r.name,
              r.club,
              r.gender,
              r.catev,
              r.catea,
              r.fede
            ]);
        if (r.sprintchallenge && r.catev === race) sprintChallenge = r;
      });

      doc.setTextColor(40);
      doc.setFontSize(11);

      const previousFinalY = (doc as any).lastAutoTable.finalY;
      podiumsForCurrentRace.length > 0 &&
        doc.text(
          'Catégorie ' +
            race +
            (sprintChallenge
              ? '  - Challenge : ' +
                sprintChallenge.name +
                ' - scratch: ' +
                sprintChallenge.rankingScratch +
                ' (' +
                sprintChallenge.club +
                ')'
              : ''),
          5,
          index === 0 ? 35 : previousFinalY + 5
        );
      // @ts-ignore
      // tslint:disable-next-line:no-unused-expression
      podiumsForCurrentRace.length > 0 &&
        // @ts-ignore
        autoTable(doc, {
          head: [['Cl.', 'Scrat.', 'Doss', 'Coureur', 'Club', 'H/F', 'Caté.V', 'Caté.A', 'Fédé']],
          headStyles: {
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 0.5,
            minCellHeight: 8
          },
          bodyStyles: {
            minCellHeight: 3,
            cellPadding: 0.5
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 10 },
            2: { cellWidth: 10 },
            3: { cellWidth: 50 },
            4: { cellWidth: 58 },
            5: { cellWidth: 10 },
            6: { cellWidth: 20 },
            7: { cellWidth: 12 },
            8: { cellWidth: 20 }
          },
          body: podiumsForCurrentRace,
          didDrawPage: (data: any) => {
            // Header
            doc.setFontSize(13);
            doc.setTextColor(40);
            //doc.setFontStyle('normal');
            if (competition.fede === 'FSGT') {
              doc.addImage(
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABUCAYAAAB0mJL5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAADesaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzE0NSA3OS4xNjM0OTksIDIwMTgvMDgvMTMtMTY6NDA6MjIgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOmlsbHVzdHJhdG9yPSJodHRwOi8vbnMuYWRvYmUuY29tL2lsbHVzdHJhdG9yLzEuMC8iIHhtbG5zOnhtcFRQZz0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3QvcGcvIiB4bWxuczpzdERpbT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL0RpbWVuc2lvbnMjIiB4bWxuczp4bXBHPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvZy8iIHhtbG5zOnBkZj0iaHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0wNy0wNVQxMzozMTozMyswMjowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTktMDctMDVUMTM6MzE6MzMrMDI6MDAiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTA2LTI0VDEwOjA0OjQwKzAyOjAwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIElsbHVzdHJhdG9yIENDIDIzLjAgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ZDg5NTNmYmYtOTY0ZS00ZDE0LWE4MzEtNmMzYmI5ZTBmZDQwIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NjAwMjJhMzEtYjc4OS0zOTRjLTkyMDQtMjA4Nzc2ZGFjOTZkIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InV1aWQ6NUQyMDg5MjQ5M0JGREIxMTkxNEE4NTkwRDMxNTA4QzgiIHhtcE1NOlJlbmRpdGlvbkNsYXNzPSJwcm9vZjpwZGYiIGlsbHVzdHJhdG9yOlR5cGU9IkRvY3VtZW50IiBpbGx1c3RyYXRvcjpTdGFydHVwUHJvZmlsZT0iUHJpbnQiIHhtcFRQZzpIYXNWaXNpYmxlT3ZlcnByaW50PSJGYWxzZSIgeG1wVFBnOkhhc1Zpc2libGVUcmFuc3BhcmVuY3k9IkZhbHNlIiB4bXBUUGc6TlBhZ2VzPSIxIiBwZGY6UHJvZHVjZXI9IkFkb2JlIFBERiBsaWJyYXJ5IDE1LjAwIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8ZGM6dGl0bGU+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPmxvZ29GU0dUc3ArdHh0X3NiPC9yZGY6bGk+IDwvcmRmOkFsdD4gPC9kYzp0aXRsZT4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NjBlZDI2YTgtYWJmMS00M2JlLTk4OTktOTJmNWM1N2JjYTY4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjI1NTM4OTMyLTYzZjItNDNjMy04ZGMxLTA2ZTFmMTYyYzQzNyIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ1dWlkOjVEMjA4OTI0OTNCRkRCMTE5MTRBODU5MEQzMTUwOEM4IiBzdFJlZjpyZW5kaXRpb25DbGFzcz0icHJvb2Y6cGRmIi8+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmQ2NjJmZTNhLTgzNGYtNGI3NS05Zjk2LTFhYzVmYWExNTRlMiIgc3RFdnQ6d2hlbj0iMjAxOS0wNi0xNFQwOTo0OToyOCswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgSWxsdXN0cmF0b3IgQ0MgMjMuMCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmZlMDk5MjItMDRmNS00OWM1LWJmZWUtYjE4MzViOWRjZGRkIiBzdEV2dDp3aGVuPSIyMDE5LTA2LTI0VDEwOjA0OjM4KzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBJbGx1c3RyYXRvciBDQyAyMy4wIChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjb252ZXJ0ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImZyb20gYXBwbGljYXRpb24vcGRmIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImRlcml2ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvdGlmZiIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MjU1Mzg5MzItNjNmMi00M2MzLThkYzEtMDZlMWYxNjJjNDM3IiBzdEV2dDp3aGVuPSIyMDE5LTA3LTA1VDEzOjMwOjM2KzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NjBlZDI2YTgtYWJmMS00M2JlLTk4OTktOTJmNWM1N2JjYTY4IiBzdEV2dDp3aGVuPSIyMDE5LTA3LTA1VDEzOjMxOjMzKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGltYWdlL3RpZmYgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBpbWFnZS90aWZmIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZDg5NTNmYmYtOTY0ZS00ZDE0LWE4MzEtNmMzYmI5ZTBmZDQwIiBzdEV2dDp3aGVuPSIyMDE5LTA3LTA1VDEzOjMxOjMzKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHhtcFRQZzpNYXhQYWdlU2l6ZSBzdERpbTp3PSIxOTIuMzQ2MDQyIiBzdERpbTpoPSIxNjYuMTkwNjMxIiBzdERpbTp1bml0PSJNaWxsaW1ldGVycyIvPiA8eG1wVFBnOlBsYXRlTmFtZXM+IDxyZGY6U2VxPiA8cmRmOmxpPkN5YW48L3JkZjpsaT4gPHJkZjpsaT5NYWdlbnRhPC9yZGY6bGk+IDxyZGY6bGk+WWVsbG93PC9yZGY6bGk+IDxyZGY6bGk+QmxhY2s8L3JkZjpsaT4gPC9yZGY6U2VxPiA8L3htcFRQZzpQbGF0ZU5hbWVzPiA8eG1wVFBnOlN3YXRjaEdyb3Vwcz4gPHJkZjpTZXE+IDxyZGY6bGk+IDxyZGY6RGVzY3JpcHRpb24geG1wRzpncm91cE5hbWU9Ikdyb3VwZSBkZSBudWFuY2VzIHBhciBkw6lmYXV0IiB4bXBHOmdyb3VwVHlwZT0iMCI+IDx4bXBHOkNvbG9yYW50cz4gPHJkZjpTZXE+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJCbGFuYyIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9Ik5vaXIiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjEwMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IlJvdWdlIENNSk4iIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iSmF1bmUgQ01KTiIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iVmVydCBDTUpOIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMTAwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkN5YW4gQ01KTiIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMTAwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQmxldSBDTUpOIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9Ik1hZ2VudGEgQ01KTiIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0xNSBNPTEwMCBKPTkwIE49MTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjE1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMDAuMDAwMDAwIiB4bXBHOnllbGxvdz0iOTAuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTkwIEo9ODUgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI5MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI4NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT04MCBKPTk1IE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iODAuMDAwMDAwIiB4bXBHOnllbGxvdz0iOTUuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09NTAgSj0xMDAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI1MC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MzUgSj04NSBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjM1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9Ijg1LjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NSBNPTAgSj05MCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iOTAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0yMCBNPTAgSj0xMDAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIyMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz01MCBNPTAgSj0xMDAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI1MC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz03NSBNPTAgSj0xMDAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI3NS4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz04NSBNPTEwIEo9MTAwIE49MTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49Ijg1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9OTAgTT0zMCBKPTk1IE49MzAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjkwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIzMC4wMDAwMDAiIHhtcEc6eWVsbG93PSI5NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjMwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz03NSBNPTAgSj03NSBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49Ijc1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9Ijc1LjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9ODAgTT0xMCBKPTQ1IE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iODAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjQ1LjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NzAgTT0xNSBKPTAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI3MC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTUuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTg1IE09NTAgSj0wIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iODUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjUwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0xMDAgTT05NSBKPTUgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9Ijk1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjUuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0xMDAgTT0xMDAgSj0yNSBOPTI1IiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIyNS4wMDAwMDAiIHhtcEc6YmxhY2s9IjI1LjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz03NSBNPTEwMCBKPTAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI3NS4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz01MCBNPTEwMCBKPTAgTj0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI1MC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0zNSBNPTEwMCBKPTM1IE49MTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjM1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMDAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMzUuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MTAgTT0xMDAgSj01MCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjEwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMDAuMDAwMDAwIiB4bXBHOnllbGxvdz0iNTAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09OTUgSj0yMCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9Ijk1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MjUgTT0yNSBKPTQwIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMjUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjI1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjQwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NDAgTT00NSBKPTUwIE49NSIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjQ1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjUwLjAwMDAwMCIgeG1wRzpibGFjaz0iNS4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NTAgTT01MCBKPTYwIE49MjUiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjUwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI1MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI2MC4wMDAwMDAiIHhtcEc6YmxhY2s9IjI1LjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz01NSBNPTYwIEo9NjUgTj00MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNTUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjYwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjY1LjAwMDAwMCIgeG1wRzpibGFjaz0iNDAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTI1IE09NDAgSj02NSBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjI1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSI0MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI2NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTMwIE09NTAgSj03NSBOPTEwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIzMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iNTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iNzUuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MzUgTT02MCBKPTgwIE49MjUiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjM1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSI2MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI4MC4wMDAwMDAiIHhtcEc6YmxhY2s9IjI1LjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz00MCBNPTY1IEo9OTAgTj0zNSIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjY1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjkwLjAwMDAwMCIgeG1wRzpibGFjaz0iMzUuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTQwIE09NzAgSj0xMDAgTj01MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjcwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjUwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz01MCBNPTcwIEo9ODAgTj03MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNTAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjcwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjgwLjAwMDAwMCIgeG1wRzpibGFjaz0iNzAuMDAwMDAwIi8+IDwvcmRmOlNlcT4gPC94bXBHOkNvbG9yYW50cz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOmxpPiA8cmRmOmxpPiA8cmRmOkRlc2NyaXB0aW9uIHhtcEc6Z3JvdXBOYW1lPSJHcmlzIiB4bXBHOmdyb3VwVHlwZT0iMSI+IDx4bXBHOkNvbG9yYW50cz4gPHJkZjpTZXE+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTEwMCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMTAwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBKPTAgTj05MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iODkuOTk5NDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTgwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSI3OS45OTg4MDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgSj0wIE49NzAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjY5Ljk5OTcwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBKPTAgTj02MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iNTkuOTk5MTAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTUwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSI1MC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgSj0wIE49NDAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjM5Ljk5OTQwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBKPTAgTj0zMCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMjkuOTk4ODAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTIwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIxOS45OTk3MDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgSj0wIE49MTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjkuOTk5MTAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIEo9MCBOPTUiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjQuOTk4ODAwIi8+IDwvcmRmOlNlcT4gPC94bXBHOkNvbG9yYW50cz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOmxpPiA8cmRmOmxpPiA8cmRmOkRlc2NyaXB0aW9uIHhtcEc6Z3JvdXBOYW1lPSJDb3VsZXVycyB2aXZlcyIgeG1wRzpncm91cFR5cGU9IjEiPiA8eG1wRzpDb2xvcmFudHM+IDxyZGY6U2VxPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MTAwIEo9MTAwIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT03NSBKPTEwMCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9Ijc1LjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0xMCBKPTk1IE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iOTUuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz04NSBNPTEwIEo9MTAwIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iODUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTEwMCBNPTkwIEo9MCBOPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjEwMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iOTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTYwIE09OTAgSj0wIE49MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjkwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAzMTAwIiB4bXBHOmJsYWNrPSIwLjAwMzEwMCIvPiA8L3JkZjpTZXE+IDwveG1wRzpDb2xvcmFudHM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpsaT4gPC9yZGY6U2VxPiA8L3htcFRQZzpTd2F0Y2hHcm91cHM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+KeYCkAAAHRVJREFUeF7tnQd8FFXXh/+b7KaQkIQk1FCCNGkqSK8iqBSpioJ0EJAmqAj6iohgAUVB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',
                'PNG',
                data.settings.margin.left,
                5,
                20,
                18
              );
            }
            doc.setFontSize(10);
            doc.text('Podiums (Open Dossard)', 90, 7);
            doc.setFontSize(13);
            doc.text('Epreuve : ' + competition.name, data.settings.margin.left + 50, 15);
            doc.text(
              'Date : ' +
                capitalizeFirstLetter(
                  moment(competition.eventDate)
                    .locale('fr')
                    .format('dddd DD MMM YYYY')
                ),
              data.settings.margin.left + 50,
              20
            );
            doc.text('Course(s) : ' + competition.races.toString(), data.settings.margin.left + 50, 25);
            // Footer
            doc.setFontSize(10);

            // jsPDF 1.4+ uses getWidth, <1.4 uses .width
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(filename + ' généré à ' + moment().format('HH:mm'), 40, pageHeight - 5);
          },
          margin: { top: 38, left: 5, right: 5 },
          styles: {
            valign: 'middle',
            halign: 'left',
            fontSize: 10,
            minCellHeight: 5
          }
        });
    });

  doc.save(filename);
};

export const licencesPDF = async (data: LicenceEntity[]) => {
  const rowstoDisplay: any[][] = [];
  const filename = 'Licences.pdf';
  data.forEach((r: LicenceEntity) => {
    rowstoDisplay.push([
      r.id,
      r.licenceNumber,
      r.name,
      r.firstName,
      r.club,
      r.gender,
      r.dept,
      r.birthYear,
      r.catea,
      r.catev,
      r.catevCX,
      r.fede,
      r.saison
    ]);
  });
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  // @ts-ignore
  const totalPagesExp = '{total_pages_count_string}';
  // @ts-ignore
  doc.autoTable({
    head: [
      [
        'ID',
        'Licence N°',
        'Nom',
        'Prenom',
        'Club',
        'H/F',
        'Dept',
        'Année',
        'Cat.A',
        'Cat.V',
        'Caté.CX',
        'Fédé.',
        'Saison'
      ]
    ],
    bodyStyles: {
      minCellHeight: 3,
      cellHeight: 3,
      cellPadding: 0.5
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 40 },
      5: { cellWidth: 10 },
      6: { cellWidth: 10 },
      7: { cellWidth: 10 },
      8: { cellWidth: 6 },
      9: { cellWidth: 6 },
      10: { cellWidth: 15 },
      11: { cellWidth: 12 },
      12: { cellWidth: 10 }
    },
    body: rowstoDisplay,
    didDrawPage: (data: any) => {
      // Header
      doc.setFontSize(14);
      doc.setTextColor(40);
      //doc.setFontStyle('normal');
      doc.setFontSize(10);
      doc.text('Open Dossard - Listing de ' + rowstoDisplay.length + ' Licences', data.settings.margin.left + 70, 10);

      // Footer
      const str = 'Page ' + doc.getNumberOfPages() + '/' + totalPagesExp;
      doc.setFontSize(8);

      // jsPDF 1.4+ uses getWidth, <1.4 uses .width
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
      doc.text('Fichier : ' + filename + ' Imprimé le : ' + moment().format('DD/MM/YYYY HH:mm:ss'), 70, pageHeight - 5);
    },
    headStyles: {
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 0.5,
      minCellHeight: 8
    },
    margin: { top: 14, left: 10 },
    styles: {
      valign: 'middle',
      fontSize: 7,
      minCellHeight: 5,
      maxCellHeight: 5,
      margin: 0
    }
  });
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY;
  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
};

export const listeEngagesPDF = async (filterByRace, currentRace, rows, competition, emargement) => {
  let rowstoDisplay: any[][] = [];
  const lrows = filterByRace(rows, currentRace);
  const filename =
    (emargement ? 'Emargement_' : 'Engagement_') +
    competition.name.replace(/\s/g, '') +
    '_cate_' +
    currentRace +
    '.pdf';
  _.orderBy(lrows, ['riderNumber'], ['asc']).forEach((r: RaceRow, index: number) => {
    if (index === 0 && !emargement) {
      rowstoDisplay.push([
        '',
        lrows.length + ' coureurs engagés',
        _.uniqBy(lrows, 'club').length + ' clubs représentés',
        '',
        _.uniqBy(lrows, 'dept').length,
        '',
        _.uniqBy(lrows, 'catea').length,
        _.uniqBy(lrows, 'catev').length,
        '',
        _.uniqBy(lrows, 'fede').length
      ]);
    }
    rowstoDisplay.push([
      displayDossard(r.riderNumber.toString()),
      r.name,
      r.club,
      r.gender,
      _.padStart(r.dept.toString(), 2, '0'),
      r.birthYear,
      r.catea,
      r.catev,
      ...[emargement ? r.licenceNumber : []],
      r.fede
    ]);
  });
  if (emargement) {
    for (let i = 0; i < 10; i++) {
      rowstoDisplay.push(Array(6).fill(''));
    }
  }
  // Emargement ? imprimer en paysage
  let doc = new jsPDF({ orientation: emargement ? 'landscape' : 'p', unit: 'mm', format: 'a4', compress: true });
  // @ts-ignore
  var totalPagesExp = '{total_pages_count_string}';
  // @ts-ignore
  doc.autoTable({
    head: [
      [
        'Doss',
        'Coureur',
        'Club',
        'H/F',
        'Dept',
        'Année',
        'Cat.A',
        'Cat.V',
        ...[emargement ? 'Licence N°' : []],
        'Fédé.',
        ...[emargement ? 'Signature' : []]
      ]
    ],
    bodyStyles: {
      minCellHeight: emargement ? 10 : 3,
      cellPadding: 0.5
    },
    rowPageBreak: 'avoid',
    headStyles: {
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: {
        cellWidth: 15,
        fillColor: [253, 238, 115],
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 13
      },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 10 },
      4: { cellWidth: 10 },
      5: { cellWidth: 12 },
      6: { cellWidth: 13 },
      7: { cellWidth: 12 },
      [emargement ? 8 : 9]: {
        cellWidth: 20
      },
      [emargement ? 9 : undefined]: {
        cellWidth: 20
      },
      [emargement ? 10 : undefined]: {
        lineWidth: 0.2,
        lineColor: [73, 138, 159]
      }
    },
    body: rowstoDisplay,
    didParseCell: function(data: any) {
      if (data && data.row.index === 0 && !emargement) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: (data: any) => {
      // Header
      doc.setFontSize(14);
      doc.setTextColor(40);

      if (competition.fede === 'FSGT') {
        const img = new Image();
        img.src = process.env.PUBLIC_URL + '/images/logos/fsgt.png';
        doc.addImage(img, 'PNG', data.settings.margin.left, 0, 12, 12);
      }
      doc.setFontSize(10);
      if (emargement) {
        doc.text("Feuille d'émargement : " + competition.name, data.settings.margin.left + 15, 4);
      } else {
        doc.text('Listing Engagés : ' + competition.name, data.settings.margin.left + 15, 4);
      }
      doc.text(
        'Date : ' +
          capitalizeFirstLetter(
            moment(competition.eventDate)
              .locale('fr')
              .format('dddd DD MMM YYYY')
          ),
        data.settings.margin.left + 15,
        8
      );
      doc.text('Catégorie(s) : ' + currentRace, data.settings.margin.left + 15, 12);

      // Footer
      const str = 'Page ' + doc.getNumberOfPages() + '/' + totalPagesExp;
      doc.setFontSize(8);

      // jsPDF 1.4+ uses getWidth, <1.4 uses .width
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
      doc.text('Fichier : ' + filename + ' Imprimé à : ' + moment().format('HH:mm:ss'), 40, pageHeight - 5);
    },
    margin: { top: 14, left: 10 },
    styles: {
      valign: 'middle',
      fontSize: 10,
      minCellHeight: 5,
      maxCellHeight: 5,
      margin: 0
    }
  });
  // @ts-ignore
  let finalY = (doc as any).lastAutoTable.finalY;
  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
};
