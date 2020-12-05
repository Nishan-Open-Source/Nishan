import { v4 as uuidv4 } from "uuid";

import Nishan from '../../Nishan';
import { TSearchManipViewParam } from "../../types";
import { status, phase, priority, subject } from '../data';

import "../env"

(async function () {
  const nishan = new Nishan({
    token: process.env.NOTION_TOKEN as string,
    interval: 1000,
  });

  const user = await nishan.getNotionUser((user) => user.family_name === 'Shaheer');
  const space = await user.getSpace((space) => space.name === 'Developer');

  await space?.createTRootPages([{
    type: "collection_view_page",
    properties: {
      title: [["Articles_"]]
    },
    format: {
      page_full_width: true,
      page_icon: "https://notion-emojis.s3-us-west-2.amazonaws.com/v0/svg-twitter/1f4d4.svg"
    },
    schema: [
      { type: "title", name: "Title" },
      {
        type: "formula",
        name: "Urgency"
      },
      {
        type: "formula",
        name: "Completed"
      },
      {
        type: "multi_select",
        name: "Subject",
        options: subject.map(({ title, color }) => ({ value: title, color, id: uuidv4() }))
      },
      {
        type: "select",
        name: "Provider",
        options: []
      },
      {
        type: "url",
        name: "Source"
      },
      {
        type: "select",
        name: "Priority",
        options: priority
      },
      {
        type: "select",
        name: "Status",
        options: status
      },
      {
        type: "select",
        name: "Phase",
        options: phase
      },
      {
        type: "date",
        name: "Learn Range",
      },
      {
        type: "date",
        name: "Revise Range",
      },
      {
        type: "date",
        name: "Practice Range",
      },
      {
        type: "formula",
        name: "Priority Counter",
      },
      {
        type: "formula",
        name: "Status Counter",
      },
      {
        type: "formula",
        name: "Phase Counter",
      },
      {
        type: "checkbox",
        name: "Learned",
      },
      {
        type: "checkbox",
        name: "Revised",
      },
      {
        type: "checkbox",
        name: "Practiced",
      }
    ],
    views: [
      ...[
        ["To Complete", "Learn"], ["Completing", "Learn"], ["Completed", "Learn"],
        ["To Complete", "Revise"], ["Completing", "Revise"], ["Completed", "Revise"],
        ["To Complete", "Practice"], ["Completing", "Practice"], ["Completed", "Practice"]
      ].map(([status, phase]) => {
        return {
          name: `${status} ${phase} Articles`,
          type: "table",
          view: [
            {
              type: "title",
              format: 300,
              name: "Title",
              sort: 'ascending'
            },
            {
              type: "formula",
              name: "Urgency",
              sort: ["descending", 0],
              format: 50
            },
            {
              type: "formula",
              name: "Completed",
              format: 50
            },
            {
              type: "multi_select",
              name: "Subject",
              format: 150
            },
            {
              type: "select",
              name: "Provider",
              format: 100
            },
            {
              type: "url",
              name: "Source"
            },
            {
              type: "select",
              name: "Priority",
              format: 100
            },
            {
              type: "select",
              name: "Status",
              format: 100,
              filter: [["enum_is", "exact", status]]
            },
            {
              type: "select",
              name: "Phase",
              format: 100,
              filter: [["enum_is", "exact", phase]]
            },
          ]
        } as TSearchManipViewParam
      }) as [TSearchManipViewParam, ...TSearchManipViewParam[]]]
  }])
}())